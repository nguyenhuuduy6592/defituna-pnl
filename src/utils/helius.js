const BATCH_SIZE = 3;
const MAX_RETRIES = 5;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

// Enhanced cache with timestamps
const timestampCache = new Map();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(body, retries = 0) {
  try {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) {
      console.error('[fetchWithRetry] Helius API key not configured');
      throw new Error('Helius API key not configured');
    }

    const rpcEndpoint = `${process.env.HELIUS_RPC_URL}/?api-key=${apiKey}`;
    
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (response.status === 429 && retries < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, retries) * 1000;
      await delay(backoffDelay);
      return fetchWithRetry(body, retries + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchWithRetry] Error response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const responseData = await response.json();
    
    // Check for RPC error -32019 (long-term storage query failure)
    if (responseData.error && responseData.error.code === -32019 && retries < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, retries) * 1000;
      await delay(backoffDelay);
      return fetchWithRetry(body, retries + 1);
    }
    
    return responseData;
  } catch (error) {
    console.error(`[fetchWithRetry] Error:`, error);
    console.error(`[fetchWithRetry] Stack:`, error.stack);
    
    if (retries < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, retries) * 1000;
      await delay(backoffDelay);
      return fetchWithRetry(body, retries + 1);
    }
    throw error;
  }
}

export async function getTransactionAge(address) {
  if (!address) {
    console.error('[getTransactionAge] Invalid address provided:', address);
    return 0;
  }

  // Check cache first
  if (timestampCache.has(address)) {
    const cached = timestampCache.get(address);
    if (Date.now() - cached.fetchTime < CACHE_DURATION) {
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

      // signaturesResponse is already JSON, no need to parse
      if (signaturesResponse.error) {
        console.error('[getTransactionAge] RPC error:', signaturesResponse.error);
        throw new Error(signaturesResponse.error.message);
      }

      const { result } = signaturesResponse;
      
      if (!result || result.length === 0) {
        throw new Error('No transactions found');
      }

      const oldestSignature = result[result.length - 1].signature;

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
        throw new Error('Transaction blockTime not found or invalid');
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
    console.error(`[getTransactionAge] Error fetching age for ${address}:`, error);
    timestampCache.set(address, { creationTimestamp: 0, fetchTime: Date.now() });
    return 0;
  }
}

// Function to process multiple positions in batches
export async function getTransactionAges(addresses) {
  const results = new Map();
  const batches = [];
  
  // Split addresses into batches
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    batches.push(addresses.slice(i, i + BATCH_SIZE));
  }
  
  // Process each batch sequentially
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(address => getTransactionAge(address))
    );
    
    batch.forEach((address, index) => {
      results.set(address, batchResults[index]);
    });
  }
  
  return results;
}