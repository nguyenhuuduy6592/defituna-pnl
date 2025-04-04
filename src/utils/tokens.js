/**
 * Token metadata utilities for DeFiTuna
 */

// In-memory cache for token metadata
const tokenMetadataCache = new Map();

// Cache expiry time in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
let lastFetchTime = 0;

/**
 * Fetch all token metadata from our API
 * @returns {Promise<Object>} Token metadata map
 */
async function fetchAllTokenMetadata() {
  try {
    const response = await fetch('/api/tokens');
    if (!response.ok) {
      throw new Error('Failed to fetch token metadata');
    }
    const metadata = await response.json();
    lastFetchTime = Date.now();
    return metadata;
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    lastFetchTime = 0;
    tokenMetadataCache.clear();
    return null;
  }
}

/**
 * Get token metadata from either cache or API
 * @param {string} tokenAddress - The token's mint address
 * @returns {Promise<Object>} Token metadata
 */
export async function getTokenMetadata(tokenAddress) {
  if (!tokenAddress) {
    return createPlaceholder('unknown');
  }

  // Check if cache needs refresh
  if (Date.now() - lastFetchTime > CACHE_TTL) {
    const metadata = await fetchAllTokenMetadata();
    if (metadata) {
      tokenMetadataCache.clear();
      Object.entries(metadata).forEach(([address, data]) => {
        tokenMetadataCache.set(address, data);
      });
    }
  }
  
  // If in cache and not in error state, return immediately
  if (tokenMetadataCache.has(tokenAddress) && lastFetchTime > 0) {
    return tokenMetadataCache.get(tokenAddress);
  }
  
  // For unknown tokens or error state, create a placeholder
  return createPlaceholder(tokenAddress);
}

function createPlaceholder(tokenAddress) {
  const shortAddress = tokenAddress === 'unknown' ? 'unknown' : 
    `${tokenAddress.slice(0, 4)}...${tokenAddress.slice(-4)}`;
  return {
    symbol: shortAddress,
    name: shortAddress,
    decimals: 9
  };
}

/**
 * Batch fetch token metadata for multiple tokens at once
 * @param {string[]} tokenAddresses - Array of token mint addresses
 * @returns {Promise<Object>} Object mapping token addresses to their metadata
 */
export async function batchGetTokenMetadata(tokenAddresses) {
  if (!tokenAddresses || !Array.isArray(tokenAddresses) || tokenAddresses.length === 0) {
    return {};
  }
  
  // Check if cache needs refresh
  if (Date.now() - lastFetchTime > CACHE_TTL) {
    const metadata = await fetchAllTokenMetadata();
    if (metadata) {
      tokenMetadataCache.clear();
      Object.entries(metadata).forEach(([address, data]) => {
        tokenMetadataCache.set(address, data);
      });
    }
  }
  
  const result = {};
  for (const address of tokenAddresses) {
    result[address] = await getTokenMetadata(address);
  }
  
  return result;
}

/**
 * Calculate the current price from sqrt_price
 * @param {string} sqrtPrice - Square root price X64 as a string
 * @param {number} tokenADecimals - Decimals for token A
 * @param {number} tokenBDecimals - Decimals for token B
 * @returns {number} Current price of token B in terms of token A
 */
export function calculatePriceFromSqrtPrice(sqrtPrice, tokenADecimals = 6, tokenBDecimals = 6) {
  if (!sqrtPrice || typeof sqrtPrice !== 'string') {
    return 0;
  }

  try {
    // Convert the square root price to a number
    const sqrtPriceNum = Number(sqrtPrice) / 1000000; // Scale down from 1M = 1.0
    
    // Square the sqrt price to get the actual price
    const price = sqrtPriceNum * sqrtPriceNum;
    
    // Adjust for token decimals
    const decimalAdjustment = Math.pow(10, tokenBDecimals - tokenADecimals);
    return price * decimalAdjustment;
  } catch (error) {
    console.error('Error calculating price from sqrt_price:', error);
    return 0;
  }
}

/**
 * Enhances a pool object with token metadata
 * @param {Object} pool - The pool object
 * @returns {Promise<Object>} Enhanced pool with token metadata
 */
export async function enhancePoolWithTokenMetadata(pool) {
  if (!pool || !pool.token_a_mint || !pool.token_b_mint) {
    return pool;
  }

  try {
    const tokenAMeta = await getTokenMetadata(pool.token_a_mint);
    const tokenBMeta = await getTokenMetadata(pool.token_b_mint);
    
    const currentPrice = calculatePriceFromSqrtPrice(
      pool.sqrt_price,
      tokenAMeta.decimals,
      tokenBMeta.decimals
    );
    
    return {
      ...pool,
      tokenA: tokenAMeta,
      tokenB: tokenBMeta,
      currentPrice
    };
  } catch (error) {
    console.error('Error enhancing pool with token metadata:', error);
    return pool;
  }
} 