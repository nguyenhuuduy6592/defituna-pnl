const BATCH_SIZE = 3;
const MAX_RETRIES = 5;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

// Enhanced cache with timestamps
const ageCache = new Map();

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
    console.log(`[fetchWithRetry] Attempt ${retries + 1}/${MAX_RETRIES}`);
    
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    // Log response status
    console.log(`[fetchWithRetry] Response status: ${response.status}`);
    
    if (response.status === 429 && retries < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, retries) * 1000;
      console.log(`[fetchWithRetry] Rate limited, retrying in ${backoffDelay}ms`);
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
      console.log(`[fetchWithRetry] Long-term storage query failed, retrying in ${backoffDelay}ms`);
      await delay(backoffDelay);
      return fetchWithRetry(body, retries + 1);
    }
    
    return responseData;
  } catch (error) {
    console.error(`[fetchWithRetry] Error:`, error);
    console.error(`[fetchWithRetry] Stack:`, error.stack);
    
    if (retries < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, retries) * 1000;
      console.log(`[fetchWithRetry] Retrying in ${backoffDelay}ms`);
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
  if (ageCache.has(address)) {
    const cached = ageCache.get(address);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[getTransactionAge] Cache hit for ${address}`);
      return cached.age;
    }
    console.log(`[getTransactionAge] Cache expired for ${address}`);
    ageCache.delete(address);
  }

  try {
    console.log(`[getTransactionAge] Fetching age for address: ${address}`);
    const getAge = async () => {
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
        console.log(`[getTransactionAge] No transactions found for ${address}`);
        throw new Error('No transactions found');
      }

      console.log(`[getTransactionAge] Found ${result.length} transactions for ${address}`);
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

      // txResponse is already JSON, no need to parse
      const { result: txResult } = txResponse;
      if (!txResult || !txResult.blockTime) {
        console.error('[getTransactionAge] Transaction details not found:', txResponse);
        throw new Error('Transaction details not found');
      }

      const now = Math.floor(Date.now() / 1000);
      const age = now - txResult.blockTime;
      
      // Cache the result with timestamp
      ageCache.set(address, { age, timestamp: Date.now() });
      return age;
    };

    return await getAge();
  } catch (error) {
    console.error('[getTransactionAge] Error:', error);
    console.error('[getTransactionAge] Stack:', error.stack);
    return 0;
  }
}

// Function to process multiple positions in batches
export async function getTransactionAges(addresses) {
  console.log(`[getTransactionAges] Processing ${addresses.length} addresses in batches of ${BATCH_SIZE}`);
  const results = new Map();
  const batches = [];
  
  // Split addresses into batches
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    batches.push(addresses.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`[getTransactionAges] Split into ${batches.length} batches`);
  
  // Process each batch sequentially
  for (const batch of batches) {
    console.log(`[getTransactionAges] Processing batch of ${batch.length} addresses`);
    const batchResults = await Promise.all(
      batch.map(address => getTransactionAge(address))
    );
    
    batch.forEach((address, index) => {
      results.set(address, batchResults[index]);
    });
  }
  
  console.log(`[getTransactionAges] Completed processing all batches. Results size: ${results.size}`);
  return results;
}