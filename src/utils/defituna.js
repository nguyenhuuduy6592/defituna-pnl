import { processTunaPosition } from './formulas.js';

// --- Simple In-Memory Cache with Different TTLs --- 
const POOL_CACHE_TTL = 30 * 1000;       // 30 seconds for pool data (contains dynamic ticks)
const MARKET_CACHE_TTL = 60 * 60 * 1000; // 1 hour for market data (changes infrequently)
const TOKEN_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for token data (extremely static)

// Map cache structure: <key, {data: any, timestamp: number}>
const marketCache = { data: null, timestamp: 0 };
const poolCache = new Map();
const tokenCache = new Map();

function isCacheValid(timestamp, ttl) {
  return Date.now() - timestamp < ttl;
}
// --- End Cache --- 

export async function fetchPositions(wallet) {
  // This data always needs to be fresh since it's the main position data
  const response = await fetch(`${process.env.DEFITUNA_API_URL}/users/${wallet}/tuna-positions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch positions: ${response.status} ${response.statusText}`);
  }
  
  const { data } = await response.json();
  if (!data || !Array.isArray(data)) {
    console.error('Invalid positions data received:', data);
    throw new Error('Invalid positions data received from API');
  }
  return data;
}

export async function fetchPoolData(poolAddress) {
  // Pool data has a short TTL since it contains the dynamic tick_current_index
  if (poolCache.has(poolAddress) && isCacheValid(poolCache.get(poolAddress).timestamp, POOL_CACHE_TTL)) {
    return poolCache.get(poolAddress).data;
  }

  const response = await fetch(`${process.env.DEFITUNA_API_URL}/pools/${poolAddress}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pool data: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  poolCache.set(poolAddress, { data: data, timestamp: Date.now() });
  return data;
}

export async function fetchMarketData() {
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
}

export async function fetchTokenData(mintAddress) {
  // Token data is practically permanent
  if (tokenCache.has(mintAddress) && isCacheValid(tokenCache.get(mintAddress).timestamp, TOKEN_CACHE_TTL)) {
    return tokenCache.get(mintAddress).data;
  }

  try {
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
    console.error(`Error fetching token data for ${mintAddress}:`, error);
    // Don't cache errors, but return default structure
    return {
      symbol: `${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`,
      mint: mintAddress,
      decimals: 9 // Default to 9 decimals if unknown
    };
  }
}

export async function processPositionsData(positionsData) {
  try {
    // 1. Fetch market data (can often be fetched concurrently with others)
    const marketDataPromise = fetchMarketData(); // Start fetching, don't await yet
    
    // 2. Get unique pools from positions
    const uniquePools = [...new Set(positionsData.map(d => d.pool))];
    
    // 3. Fetch pool data in parallel
    const poolPromises = uniquePools.map(poolAddress => fetchPoolData(poolAddress));
    const poolResponses = await Promise.all(poolPromises);
    const poolsData = uniquePools.reduce((acc, poolAddress, index) => {
      acc[poolAddress] = poolResponses[index];
      return acc;
    }, {});
    
    // Ensure market data is resolved before proceeding (if needed for token fetching)
    const marketData = await marketDataPromise;

    // 4. Get unique token mints from all pools
    const uniqueMints = new Set();
    Object.values(poolsData).forEach(poolResponse => {
      if (poolResponse && poolResponse.data) { // Check if pool data is valid
          const pool = poolResponse.data;
          if (pool.token_a_mint) uniqueMints.add(pool.token_a_mint);
          if (pool.token_b_mint) uniqueMints.add(pool.token_b_mint);
      } else {
          console.warn("Invalid pool response encountered while extracting mints:", poolResponse);
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
    const processed = positionsData.map((position) => { // Removed unused index
      const poolAddress = position.pool;
      const poolData = poolsData[poolAddress];
      // Add checks for poolData and poolData.data existence
      if (!poolData || !poolData.data) {
        console.error('Missing or invalid pool data for position:', position);
        return null; 
      }
      const pool = poolData.data;
      
      const tokenA = tokensData[pool.token_a_mint];
      const tokenB = tokensData[pool.token_b_mint];
      
      if (!tokenA || !tokenB) {
        console.error('Missing token data for position:', position);
        return null;
      }
      
      const processedPosition = processTunaPosition(
        { data: position },
        poolData,
        marketData, // Use resolved marketData
        tokenA,
        tokenB
      );
      
      return {
        ...processedPosition,
        pair: `${tokenA.symbol}/${tokenB.symbol}`,
        walletAddress: position.authority,
        positionAddress: position.address,
        state: position.state,
      };
    }).filter(Boolean); 
    
    return processed;

  } catch (error) {
    console.error('Error processing positions data:', error);
    throw error;
  }
}