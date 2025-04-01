/**
 * DeFiTuna API utilities.
 * This module provides functions to fetch and process data from the DeFiTuna API.
 */

import { processTunaPosition } from './formulas.js';

// --- Simple In-Memory Cache with Different TTLs --- 
const POOL_CACHE_TTL = 30 * 1000;       // 30 seconds for pool data (contains dynamic ticks)
const MARKET_CACHE_TTL = 60 * 60 * 1000; // 1 hour for market data (changes infrequently)
const TOKEN_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for token data (extremely static)
const ALL_POOLS_CACHE_TTL = 60 * 1000;  // 1 minute for all pools data

// --- Value Encoding Constants ---
const USD_MULTIPLIER = 100;       // Convert dollars to cents (2 decimal places)
const PRICE_MULTIPLIER = 1000000; // 6 decimal places for prices
const LEVERAGE_MULTIPLIER = 100;  // 2 decimal places for leverage

/**
 * Encodes decimal values as integers to reduce payload size
 * @param {number} value - The decimal value to encode
 * @param {number} multiplier - The multiplier to use (e.g., 100 for 2 decimal places)
 * @returns {number|null} - The encoded integer value or null for invalid inputs
 */
function encodeValue(value, multiplier) {
  if (value === Infinity || value === -Infinity || isNaN(value) || value === null || value === undefined) {
    return null;
  }
  return Math.round(value * multiplier);
}

// --- Cache Functions ---
// Map cache structure: <key, {data: any, timestamp: number}>
const marketCache = { data: null, timestamp: 0 };
const poolCache = new Map();
const tokenCache = new Map();
const allPoolsCache = { data: null, timestamp: 0 };

/**
 * Checks if a cached item is still valid based on its timestamp and TTL
 * @param {number} timestamp - The timestamp when the item was cached
 * @param {number} ttl - Time to live in milliseconds
 * @returns {boolean} - Whether the cache is still valid
 */
function isCacheValid(timestamp, ttl) {
  return Date.now() - timestamp < ttl;
}
// --- End Cache --- 

/**
 * Fetches position data for a wallet address
 * @param {string} wallet - The wallet address to fetch positions for
 * @returns {Promise<Array>} - Array of position data
 * @throws {Error} If the API request fails or returns invalid data
 */
export async function fetchPositions(wallet) {
  if (!wallet) {
    console.error('[fetchPositions] No wallet address provided');
    throw new Error('Wallet address is required');
  }

  try {
    // This data always needs to be fresh since it's the main position data
    const response = await fetch(`${process.env.DEFITUNA_API_URL}/users/${wallet}/tuna-positions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch positions: ${response.status} ${response.statusText}`);
    }
    
    const { data } = await response.json();
    if (!data || !Array.isArray(data)) {
      console.error('[fetchPositions] Invalid positions data received:', data);
      throw new Error('Invalid positions data received from API');
    }
    return data;
  } catch (error) {
    console.error('[fetchPositions] Error:', error.message);
    throw error;
  }
}

/**
 * Fetches pool data for a specific pool address
 * @param {string} poolAddress - The pool address to fetch data for
 * @returns {Promise<Object>} - Pool data
 * @throws {Error} If the API request fails
 */
export async function fetchPoolData(poolAddress) {
  if (!poolAddress) {
    console.error('[fetchPoolData] No pool address provided');
    throw new Error('Pool address is required');
  }

  try {
    // Pool data has a short TTL since it contains the dynamic tick_current_index
    if (poolCache.has(poolAddress) && isCacheValid(poolCache.get(poolAddress).timestamp, POOL_CACHE_TTL)) {
      return poolCache.get(poolAddress).data;
    }

    const response = await fetch(`${process.env.DEFITUNA_API_URL}/pools/${poolAddress}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pool data: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response and extract the data field
    const responseJson = await response.json();
    
    // Access the nested 'data' field
    const poolData = responseJson.data;
    
    if (!poolData) {
      console.error(`[fetchPoolData] No data field in API response for ${poolAddress}`);
      throw new Error('API response missing data field');
    }
    
    // Store in cache
    poolCache.set(poolAddress, { data: poolData, timestamp: Date.now() });
    return poolData;
  } catch (error) {
    console.error(`[fetchPoolData] Error fetching pool data for ${poolAddress}:`, error.message);
    throw error;
  }
}

/**
 * Fetches market data for all markets
 * @returns {Promise<Object>} - Market data
 * @throws {Error} If the API request fails
 */
export async function fetchMarketData() {
  try {
    // Market data has a long TTL since it changes infrequently
    if (marketCache.data && isCacheValid(marketCache.timestamp, MARKET_CACHE_TTL)) {
      return marketCache.data;
    }

    const response = await fetch(`${process.env.DEFITUNA_API_URL}/markets`);
    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    marketCache.data = data;
    marketCache.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('[fetchMarketData] Error:', error.message);
    throw error;
  }
}

/**
 * Fetches token data for a specific mint address
 * @param {string} mintAddress - The mint address to fetch token data for
 * @returns {Promise<Object>} - Token data
 */
export async function fetchTokenData(mintAddress) {
  if (!mintAddress) {
    console.error('[fetchTokenData] No mint address provided');
    return {
      symbol: 'UNKNOWN',
      mint: '',
      decimals: 9 // Default to 9 decimals if unknown
    };
  }

  try {
    // Token data is practically permanent
    if (tokenCache.has(mintAddress) && isCacheValid(tokenCache.get(mintAddress).timestamp, TOKEN_CACHE_TTL)) {
      return tokenCache.get(mintAddress).data;
    }

    const response = await fetch(`${process.env.DEFITUNA_API_URL}/mints/${mintAddress}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch token data: ${response.status} ${response.statusText}`);
    }
    const { data } = await response.json();
    const tokenData = {
      symbol: data.symbol,
      mint: data.mint,
      decimals: data.decimals
    };
    tokenCache.set(mintAddress, { data: tokenData, timestamp: Date.now() });
    return tokenData;
  } catch (error) {
    console.error(`[fetchTokenData] Error fetching token data for ${mintAddress}:`, error.message);
    // Don't cache errors, but return default structure
    return {
      symbol: `${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`,
      mint: mintAddress,
      decimals: 9 // Default to 9 decimals if unknown
    };
  }
}

/**
 * Processes position data by fetching and enriching with related data
 * @param {Array} positionsData - Array of position data objects
 * @returns {Promise<Array>} - Processed position data with calculated values
 * @throws {Error} If processing fails
 */
export async function processPositionsData(positionsData) {
  if (!positionsData || !Array.isArray(positionsData) || positionsData.length === 0) {
    console.warn('[processPositionsData] No positions data provided');
    return [];
  }

  try {
    // 1. Fetch market data (can often be fetched concurrently with others)
    const marketDataPromise = fetchMarketData(); // Start fetching, don't await yet
    
    // 2. Get unique pools from positions
    const uniquePools = [...new Set(positionsData.map(d => d.pool).filter(Boolean))];
    
    // 3. Fetch pool data in parallel
    const poolPromises = uniquePools.map(poolAddress => fetchPoolData(poolAddress));
    const poolResponses = await Promise.all(poolPromises);
    const poolsData = uniquePools.reduce((acc, poolAddress, index) => {
      acc[poolAddress] = poolResponses[index];
      return acc;
    }, {});
    
    // Ensure market data is resolved before proceeding
    const marketData = await marketDataPromise;

    // 4. Get unique token mints from all pools
    const uniqueMints = new Set();
    
    Object.values(poolsData).forEach(poolResponse => {
      // Adapted to handle the new API structure - poolResponse is now the direct data object
      if (poolResponse) {
        // Access token mints directly from the pool object
        if (poolResponse.token_a_mint) uniqueMints.add(poolResponse.token_a_mint);
        if (poolResponse.token_b_mint) uniqueMints.add(poolResponse.token_b_mint);
      } else {
        console.warn("[processPositionsData] Invalid pool response encountered while extracting mints:", poolResponse);
      }
    });
    
    const uniqueMintsArray = Array.from(uniqueMints);
    
    // 5. Fetch token data in parallel
    const tokenPromises = uniqueMintsArray.map(mintAddress => fetchTokenData(mintAddress));
    const tokenResults = await Promise.all(tokenPromises);
    const tokensData = uniqueMintsArray.reduce((acc, mintAddress, index) => {
      acc[mintAddress] = tokenResults[index];
      return acc;
    }, {});
    
    // 6. Process each position with all the gathered data
    const processed = positionsData.map((position) => {
      if (!position || !position.pool) {
        console.warn('[processPositionsData] Invalid position data:', position);
        return null;
      }

      const poolAddress = position.pool;
      const poolData = poolsData[poolAddress];
      
      // Check if pool data exists - with the new API structure
      if (!poolData) {
        console.error('[processPositionsData] Missing or invalid pool data for position:', position);
        return null;
      }
      
      // Get token data using the mints from the pool
      const tokenA = tokensData[poolData.token_a_mint];
      const tokenB = tokensData[poolData.token_b_mint];
      
      if (!tokenA || !tokenB) {
        console.error('[processPositionsData] Missing token data for position:', position);
        return null;
      }
      
      // Process the position with the updated data structure
      const processedPosition = processTunaPosition(
        { data: position },
        { data: poolData }, // Preserve the expected structure for the formulas
        marketData,
        tokenA,
        tokenB
      );
      
      // Return only the fields actually used by the frontend with numeric encoding for decimal values
      return {
        // Core position data (no encoding needed)
        p_addr: position.address,
        state: position.state,
        pair: `${tokenA.symbol}/${tokenB.symbol}`,
        
        // Add opened_at if available
        opened_at: position.opened_at,
        
        // Price data with numeric encoding
        c_price: encodeValue(processedPosition.currentPrice, PRICE_MULTIPLIER), // currentPrice
        e_price: encodeValue(processedPosition.entryPrice, PRICE_MULTIPLIER),   // entryPrice
        r_prices: { // rangePrices
          l: encodeValue(processedPosition.rangePrices.lower, PRICE_MULTIPLIER),
          u: encodeValue(processedPosition.rangePrices.upper, PRICE_MULTIPLIER)
        },
        
        // Liquidation prices with numeric encoding
        liq_price: { // liquidationPrice
          l: encodeValue(processedPosition.liquidationPrice.lower, PRICE_MULTIPLIER),
          u: encodeValue(processedPosition.liquidationPrice.upper, PRICE_MULTIPLIER)
        },
        lim_prices: { // limitOrderPrices
          l: encodeValue(processedPosition.limitOrderPrices.lower, PRICE_MULTIPLIER),
          u: encodeValue(processedPosition.limitOrderPrices.upper, PRICE_MULTIPLIER)
        },
        
        // Positional data with numeric encoding
        lev: encodeValue(processedPosition.leverage, LEVERAGE_MULTIPLIER), // leverage
        sz: encodeValue(processedPosition.size, USD_MULTIPLIER),           // size
        
        // Financial metrics with numeric encoding
        pnl: {
          u: encodeValue(processedPosition.pnl.usd, USD_MULTIPLIER), // usd
          b: processedPosition.pnl.bps // bps is already an integer, no encoding needed
        },
        yld: { // yield
          u: encodeValue(processedPosition.yield.usd, USD_MULTIPLIER) // usd
        },
        cmp: { // compounded
          u: encodeValue(processedPosition.compounded.usd, USD_MULTIPLIER) // usd
        },
        
        // Display amounts with numeric encoding
        col: { // collateral
          u: encodeValue(processedPosition.collateral.usd, USD_MULTIPLIER) // usd
        },
        dbt: { // debt
          u: encodeValue(processedPosition.debt.usd, USD_MULTIPLIER) // usd
        },
        int: { // interest
          u: encodeValue(processedPosition.interest.usd, USD_MULTIPLIER) // usd
        }
      };
    }).filter(Boolean); 
    
    return processed;
  } catch (error) {
    console.error('[processPositionsData] Error processing positions data:', error.message);
    throw error;
  }
}

/**
 * Fetches all available pools
 * @returns {Promise<Object>} - Pools data
 * @throws {Error} If the API request fails
 */
export async function fetchAllPools() {
  try {
    // Pools data can be cached for a short period
    if (allPoolsCache.data && isCacheValid(allPoolsCache.timestamp, ALL_POOLS_CACHE_TTL)) {
      return allPoolsCache.data;
    }

    const response = await fetch(`${process.env.DEFITUNA_API_URL}/pools`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pools data: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response - handle both array response directly or data wrapper
    const responseJson = await response.json();
    
    // API might return pools directly as an array now
    let poolsData;
    if (Array.isArray(responseJson)) {
      poolsData = responseJson;
    } else if (responseJson.data && Array.isArray(responseJson.data)) {
      poolsData = responseJson.data;
    } else {
      console.error('[fetchAllPools] Unexpected response format:', responseJson);
      poolsData = [];
    }
    
    // Store in cache with consistent structure
    allPoolsCache.data = poolsData;
    allPoolsCache.timestamp = Date.now();
    return poolsData;
  } catch (error) {
    console.error('[fetchAllPools] Error:', error.message);
    throw error;
  }
}