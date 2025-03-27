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
    
    return response;
  } catch (error) {
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
    console.error('Invalid address provided:', address);
    return 'Unknown';
  }

  // Check cache first
  if (ageCache.has(address)) {
    const cached = ageCache.get(address);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.age;
    }
    ageCache.delete(address);
  }

  try {
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

      const signaturesData = await signaturesResponse.json();
      
      if (signaturesData.error) {
        console.error('RPC error:', signaturesData.error);
        throw new Error(signaturesData.error.message);
      }

      const { result } = signaturesData;
      
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

      const txData = await txResponse.json();
      const { result: txResult } = txData;
      if (!txResult || !txResult.blockTime) {
        throw new Error('Transaction details not found');
      }

      const now = Math.floor(Date.now() / 1000);
      const age = now - txResult.blockTime;
      
      // Convert to human readable format
      const days = Math.floor(age / 86400);
      const hours = Math.floor((age % 86400) / 3600);
      const minutes = Math.floor((age % 3600) / 60);
      const seconds = age % 60;
      
      let ageString;
      if (days > 0) {
        ageString = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
      } else if (hours > 0) {
        ageString = `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        ageString = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
      } else {
        ageString = `${seconds}s`;
      }

      // Cache the result with timestamp
      ageCache.set(address, { age: ageString, timestamp: Date.now() });
      return ageString;
    };

    return await getAge();
  } catch (error) {
    console.error('Error fetching transaction age:', error);
    return 'Unknown';
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