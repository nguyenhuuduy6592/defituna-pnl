/**
 * Token metadata utilities for DeFiTuna
 */

import { sqrtPriceToPrice } from "@orca-so/whirlpools-core";

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
    
    const currentPrice = sqrtPriceToPrice(
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

// Add exports for other functions if they aren't already exported
export { createPlaceholder, fetchAllTokenMetadata }; 