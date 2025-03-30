/**
 * Helius API utilities for blockchain transaction fetching.
 * This module provides functions to interact with Helius RPC API
 * for retrieving transaction data and timestamps from the Solana blockchain.
 */

// Configuration constants
const BATCH_SIZE = 3;
const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 1000;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes cache

// Enhanced cache with timestamps
const timestampCache = new Map();

/**
 * Creates a delay using a promise
 * @param {number} ms - The delay duration in milliseconds
 * @returns {Promise<void>} A promise that resolves after the specified delay
 */
function delay(ms) {
  if (typeof ms !== 'number' || ms < 0) {
    console.warn('[delay] Invalid delay time, using default 1000ms');
    ms = 1000;
  }
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetches data from Helius API with exponential backoff retry logic
 * @param {Object} body - The request body to send to the API
 * @param {number} retries - The current retry attempt count
 * @returns {Promise<Object>} The API response data
 * @throws {Error} If the request fails after all retries
 */
async function fetchWithRetry(body, retries = 0) {
  try {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) {
      console.error('[fetchWithRetry] Helius API key not configured');
      throw new Error('Helius API key not configured');
    }

    const rpcEndpoint = `${process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com'}/?api-key=${apiKey}`;
    
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    // Handle rate limiting with exponential backoff
    if (response.status === 429 && retries < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, retries) * RETRY_BASE_DELAY_MS;
      console.warn(`[fetchWithRetry] Rate limited, retrying in ${backoffDelay}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
      await delay(backoffDelay);
      return fetchWithRetry(body, retries + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchWithRetry] Error response: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const responseData = await response.json();
    
    // Check for RPC error -32019 (long-term storage query failure)
    if (responseData.error && responseData.error.code === -32019 && retries < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, retries) * RETRY_BASE_DELAY_MS;
      console.warn(`[fetchWithRetry] Long-term storage query failure, retrying in ${backoffDelay}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
      await delay(backoffDelay);
      return fetchWithRetry(body, retries + 1);
    }

    // Handle other RPC errors
    if (responseData.error) {
      console.error(`[fetchWithRetry] RPC error:`, responseData.error);
      throw new Error(`RPC error: ${responseData.error.message || JSON.stringify(responseData.error)}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`[fetchWithRetry] Error:`, error.message);
    
    if (retries < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, retries) * RETRY_BASE_DELAY_MS;
      console.warn(`[fetchWithRetry] Request failed, retrying in ${backoffDelay}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
      await delay(backoffDelay);
      return fetchWithRetry(body, retries + 1);
    }
    throw error;
  }
}

/**
 * Gets the earliest transaction timestamp for a given address
 * @param {string} address - The blockchain address to query
 * @returns {Promise<number>} Unix timestamp of the earliest transaction, or 0 if not found
 */
export async function getTransactionAge(address) {
  if (!address || typeof address !== 'string') {
    console.error('[getTransactionAge] Invalid address provided:', address);
    return 0;
  }

  // Check cache first
  if (timestampCache.has(address)) {
    const cached = timestampCache.get(address);
    if (Date.now() - cached.fetchTime < CACHE_DURATION_MS) {
      return cached.creationTimestamp;
    }
    timestampCache.delete(address);
  }

  try {
    const getTimestamp = async () => {
      const signaturesResponse = await fetchWithRetry({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [
          address.toString(),
          { limit: 1000 }
        ]
      });

      const { result } = signaturesResponse;
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        console.warn(`[getTransactionAge] No transactions found for address: ${address}`);
        return 0;
      }

      // Get the oldest signature (last in the result array)
      const oldestSignature = result[result.length - 1].signature;
      if (!oldestSignature) {
        console.error('[getTransactionAge] Invalid signature in result');
        return 0;
      }

      const txResponse = await fetchWithRetry({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [
          oldestSignature,
          { maxSupportedTransactionVersion: 0 }
        ]
      });

      const { result: txResult } = txResponse;
      if (!txResult || typeof txResult.blockTime !== 'number') {
        console.error('[getTransactionAge] Transaction blockTime not found or invalid:', txResponse);
        return 0;
      }

      const creationTimestamp = txResult.blockTime;
      
      // Cache the timestamp result with fetch timestamp
      timestampCache.set(address, { 
        creationTimestamp: creationTimestamp, 
        fetchTime: Date.now() 
      });
      
      return creationTimestamp;
    };

    return await getTimestamp();
  } catch (error) {
    console.error(`[getTransactionAge] Error fetching age for ${address}:`, error.message);
    // Cache the error state to avoid repeated failed calls
    timestampCache.set(address, { creationTimestamp: 0, fetchTime: Date.now() });
    return 0;
  }
}

/**
 * Processes multiple addresses in batches to get their transaction ages
 * @param {string[]} addresses - Array of blockchain addresses
 * @returns {Promise<Map<string, number>>} Map of addresses to their transaction ages
 */
export async function getTransactionAges(addresses) {
  if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
    console.warn('[getTransactionAges] No valid addresses provided');
    return new Map();
  }

  // Filter out invalid addresses
  const validAddresses = addresses.filter(addr => addr && typeof addr === 'string');
  
  const results = new Map();
  const batches = [];
  
  // Split addresses into batches
  for (let i = 0; i < validAddresses.length; i += BATCH_SIZE) {
    batches.push(validAddresses.slice(i, i + BATCH_SIZE));
  }
  
  // Process each batch sequentially
  for (const batch of batches) {
    try {
      const batchResults = await Promise.all(
        batch.map(address => getTransactionAge(address))
      );
      
      batch.forEach((address, index) => {
        results.set(address, batchResults[index]);
      });
    } catch (error) {
      console.error('[getTransactionAges] Error processing batch:', error.message);
      // Set 0 for failed batch addresses
      batch.forEach(address => {
        results.set(address, 0);
      });
    }
  }
  
  return results;
}