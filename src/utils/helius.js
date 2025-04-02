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
const DEFITUNA_PROGRAM_ID = 'tuna4uSQZncNeeiAMKbstuxA9CUkHH6HmC64wgmnogD';

// Enhanced cache with timestamps
const timestampCache = new Map();
const transactionHistoryCache = new Map(); // Cache for transaction signatures
const transactionDetailCache = new Map(); // Cache for full transaction details

// Time constants
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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
export async function fetchWithRetry(body, retries = 0) {
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

/**
 * Fetches recent transaction signatures for a given address within the last 7 days.
 * Uses in-memory caching.
 * @param {string} address - The blockchain address to query.
 * @param {number} limit - The maximum number of signatures to fetch initially.
 * @returns {Promise<Array<Object>>} Array of transaction signature objects within the last 7 days.
 */
export async function fetchTransactionSignatures(address, limit = 100) {
  if (!address || typeof address !== 'string') {
    console.error('[fetchTransactionSignatures] Invalid address provided:', address);
    return [];
  }

  const cacheKey = `${address}-${limit}`;
  // Check cache first
  if (transactionHistoryCache.has(cacheKey)) {
    const cached = transactionHistoryCache.get(cacheKey);
    // Use the same CACHE_DURATION_MS for this cache for now
    if (Date.now() - cached.fetchTime < CACHE_DURATION_MS) {
      return cached.signatures;
    }
    transactionHistoryCache.delete(cacheKey);
  }

  try {
    const response = await fetchWithRetry({
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [
        address.toString(),
        { limit: limit }
      ]
    });

    const { result } = response;
    if (!result || !Array.isArray(result)) {
      console.warn(`[fetchTransactionSignatures] No signature results found for address: ${address}`);
      // Cache empty result to avoid refetching quickly
      transactionHistoryCache.set(cacheKey, { signatures: [], fetchTime: Date.now() });
      return [];
    }

    const sevenDaysAgoTimestamp = Math.floor((Date.now() - SEVEN_DAYS_MS) / 1000);

    // Filter signatures by blockTime (must be within the last 7 days)
    const recentSignatures = result.filter(sig => sig.blockTime && sig.blockTime >= sevenDaysAgoTimestamp);

    // Cache the filtered signatures
    transactionHistoryCache.set(cacheKey, { 
      signatures: recentSignatures, 
      fetchTime: Date.now() 
    });

    return recentSignatures;

  } catch (error) {
    console.error(`[fetchTransactionSignatures] Error fetching signatures for ${address}:`, error.message);
    // Don't cache errors, allow retrying later
    return []; // Return empty array on error
  }
}

/**
 * Fetches full transaction details for a given list of signatures.
 * Uses batching and in-memory caching.
 * @param {Array<string>} signatures - Array of transaction signatures.
 * @returns {Promise<Array<Object>>} Array of transaction detail objects.
 */
export async function fetchTransactionsDetails(signatures) {
  if (!signatures || !Array.isArray(signatures) || signatures.length === 0) {
    console.warn('[fetchTransactionsDetails] No valid signatures provided');
    return [];
  }

  const requests = [];
  const signaturesToFetch = [];
  const cachedDetailsMap = new Map(); // Store cached results temporarily

  // Check cache first and identify signatures needing fetch
  for (const signature of signatures) {
    if (transactionDetailCache.has(signature)) {
      const cached = transactionDetailCache.get(signature);
      if (Date.now() - cached.fetchTime < CACHE_DURATION_MS) {
        cachedDetailsMap.set(signature, cached.details); // Store valid cached details
      } else {
        transactionDetailCache.delete(signature); // Cache expired
        signaturesToFetch.push(signature);
      }
    } else {
      signaturesToFetch.push(signature);
    }
  }

  // If all details are cached and valid, return them in the correct order
  if (signaturesToFetch.length === 0) {
    return signatures.map(sig => cachedDetailsMap.get(sig)).filter(details => details !== null && details !== undefined); // Ensure order and filter nulls
  }

  // Prepare batch requests for all signatures needing fetch
  signaturesToFetch.forEach((signature, index) => {
      requests.push({
          jsonrpc: '2.0',
          id: `tx-${signature.slice(0, 8)}-${index}`, // Unique ID per request
          method: 'getTransaction',
          params: [
            signature,
            { maxSupportedTransactionVersion: 0 } // Ensure compatibility
          ]
      });
  });

  const fetchedDetailsMap = new Map();

  try {
    // Make a SINGLE batch request using fetchWithRetry
    const batchResponse = await fetchWithRetry(requests);

    // Process the response array
    if (Array.isArray(batchResponse)) {
      batchResponse.forEach((responseItem, index) => {
        // Find the original signature corresponding to this response item
        // This relies on Helius returning responses in the same order as requests in the batch
        const originalSignature = signaturesToFetch[index]; 
        if (!originalSignature) return; // Should not happen

        if (responseItem.result) {
          const details = responseItem.result;
          fetchedDetailsMap.set(originalSignature, details); // Store successful fetches
          // Cache the result
          transactionDetailCache.set(originalSignature, { 
            details: details, 
            fetchTime: Date.now() 
          });
        } else if (responseItem.error) {
          console.error(`[fetchTransactionsDetails] Error in batch response for signature ${originalSignature}:`, responseItem.error.message);
          fetchedDetailsMap.set(originalSignature, null); // Indicate fetch failure
        }
      });
    } else if (batchResponse.error) {
      // Handle potential error for the entire batch request itself
      console.error('[fetchTransactionsDetails] Error fetching batch:', batchResponse.error);
      // Mark all signatures in this batch as failed
      signaturesToFetch.forEach(sig => fetchedDetailsMap.set(sig, null));
    } else {
      // Handle unexpected response format
      console.error('[fetchTransactionsDetails] Unexpected response format for batch request:', batchResponse);
      signaturesToFetch.forEach(sig => fetchedDetailsMap.set(sig, null));
    }
  } catch (error) {
    console.error(`[fetchTransactionsDetails] Error processing batch request:`, error.message);
    // Mark all signatures in this batch as failed on catch
    signaturesToFetch.forEach(sig => fetchedDetailsMap.set(sig, null));
  }

  // Combine cached and newly fetched results, maintaining original order
  const finalResults = signatures.map(sig => {
      if (cachedDetailsMap.has(sig)) {
          return cachedDetailsMap.get(sig); // Use initially cached result
      }
      // If it was fetched (successfully or not), return the result
      if (fetchedDetailsMap.has(sig)) {
           return fetchedDetailsMap.get(sig);
      }
      // Should not happen if logic is correct, but as a fallback for uncached/unfetched:
      return null; 
  }).filter(details => details !== null); // Filter out any nulls from failures or misses

  return finalResults;
}

/**
 * Filters an array of transaction details to include only those interacting with the DeFiTuna program.
 * @param {Array<Object>} transactions - Array of transaction detail objects from Helius.
 * @returns {Array<Object>} Filtered array of DeFiTuna transaction details.
 */
export function filterDeFiTunaTransactions(transactions) {
  if (!transactions || !Array.isArray(transactions)) {
    return [];
  }

  return transactions.filter(tx => {
    // Add more robust checks for nested properties
    if (
      !tx || 
      !tx.transaction || 
      !tx.transaction.message || 
      !Array.isArray(tx.transaction.message.instructions) ||
      tx.transaction.message.instructions.length === 0 // Also check if instructions array is empty
    ) {
      return false; // Skip malformed or irrelevant transactions
    }

    // Check if any instruction in the transaction involves the DeFiTuna program
    return tx.transaction.message.instructions.some(instruction => 
      instruction && instruction.programId === DEFITUNA_PROGRAM_ID
    );
  });
}

/**
 * Fetches recent (last 7 days) transactions for a wallet address
 * and filters them to include only those interacting with the DeFiTuna program.
 * This combines signature fetching, detail fetching, and filtering.
 * Does not yet parse instruction data.
 * 
 * @param {string} address - The wallet address to fetch transactions for.
 * @param {number} limit - The maximum number of recent signatures to initially check.
 * @returns {Promise<Array<Object>>} Filtered array of DeFiTuna transaction detail objects.
 */
export async function fetchRecentDeFiTunaTransactions(address, limit = 20) {
  if (!address || typeof address !== 'string') {
    console.error('[fetchRecentDeFiTunaTransactions] Invalid address provided:', address);
    return [];
  }

  try {
    // 1. Fetch recent signatures
    const recentSignaturesInfo = await fetchTransactionSignatures(address, limit);
    if (!recentSignaturesInfo || recentSignaturesInfo.length === 0) {
      return [];
    }

    // Extract just the signature strings
    const signatures = recentSignaturesInfo.map(sigInfo => sigInfo.signature);

    // 2. Fetch details for these signatures
    const transactionDetails = await fetchTransactionsDetails(signatures);
    if (!transactionDetails || transactionDetails.length === 0) {
      return [];
    }

    // 3. Filter for DeFiTuna transactions
    const defiTunaTransactions = filterDeFiTunaTransactions(transactionDetails);
    
    // 4. Return the filtered transactions (still need parsing later)
    return defiTunaTransactions;

  } catch (error) {
    console.error(`[fetchRecentDeFiTunaTransactions] Error fetching or filtering transactions for ${address}:`, error.message);
    return []; // Return empty array on error
  }
}