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
    return {};
  }
}

/**
 * Get token metadata from either cache or API
 * @param {string} tokenAddress - The token's mint address
 * @returns {Promise<Object>} Token metadata
 */
export async function getTokenMetadata(tokenAddress) {
  // Check if cache needs refresh
  if (Date.now() - lastFetchTime > CACHE_TTL) {
    const metadata = await fetchAllTokenMetadata();
    tokenMetadataCache.clear();
    Object.entries(metadata).forEach(([address, data]) => {
      tokenMetadataCache.set(address, data);
    });
  }
  
  // If in cache, return immediately
  if (tokenMetadataCache.has(tokenAddress)) {
    return tokenMetadataCache.get(tokenAddress);
  }
  
  // For unknown tokens, create a placeholder
  const shortAddress = `${tokenAddress.slice(0, 4)}...${tokenAddress.slice(-4)}`;
  const placeholder = {
    symbol: shortAddress,
    name: shortAddress,
    decimals: 9
  };
  
  // Add to cache
  tokenMetadataCache.set(tokenAddress, placeholder);
  return placeholder;
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
    tokenMetadataCache.clear();
    Object.entries(metadata).forEach(([address, data]) => {
      tokenMetadataCache.set(address, data);
    });
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
  try {
    const sqrtPriceBigInt = BigInt(sqrtPrice);
    const price = (sqrtPriceBigInt * sqrtPriceBigInt).toString();
    const decimalPrice = Number(price) / 2 ** 128;
    const adjustedPrice = decimalPrice * (10 ** (tokenBDecimals - tokenADecimals));
    return adjustedPrice;
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