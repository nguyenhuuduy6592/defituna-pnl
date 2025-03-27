const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const BATCH_SIZE = 5; // Process 5 positions at a time
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_RETRIES = 3;

// Cache for transaction ages
const ageCache = new Map();

// Queue for rate limiting
const requestQueue = [];
let lastRequestTime = 0;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processWithRateLimit(fn) {
  const now = Date.now();
  const timeElapsed = now - lastRequestTime;
  
  if (timeElapsed < RATE_LIMIT_WINDOW) {
    await delay(RATE_LIMIT_WINDOW - timeElapsed);
  }
  
  lastRequestTime = Date.now();
  return fn();
}

async function fetchWithRetry(url, options, retries = 0) {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429 && retries < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, retries) * 1000;
      await delay(backoffDelay);
      return fetchWithRetry(url, options, retries + 1);
    }
    
    return response;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, retries) * 1000;
      await delay(backoffDelay);
      return fetchWithRetry(url, options, retries + 1);
    }
    throw error;
  }
}

export async function getTransactionAge(address) {
  // Validate address parameter
  if (!address) {
    console.error('Invalid address provided:', address);
    return 'Unknown';
  }

  // Check cache first
  if (ageCache.has(address)) {
    return ageCache.get(address);
  }

  try {
    const getAge = async () => {
      // Get signatures for address
      const signaturesResponse = await fetchWithRetry(SOLANA_RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [
            address.toString(), // Ensure address is converted to string
            { limit: 1000 }
          ]
        })
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

      // Get the last (oldest) signature
      const oldestSignature = result[result.length - 1].signature;

      // Get transaction details
      const txResponse = await fetchWithRetry(SOLANA_RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [
            oldestSignature,
            { maxSupportedTransactionVersion: 0 }
          ]
        })
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
      
      if (days > 0) {
        if (hours > 0) {
          return `${days}d ${hours}h`.trim();  // Show days and hours
        }
        return `${days}d`;
      }
      if (hours > 0) {
        return `${hours}h ${minutes}m`.trim();  // Show hours and minutes
      }
      if (minutes > 0) {
        if (seconds > 0) {
          return `${minutes}m ${seconds}s`.trim();  // Show minutes and seconds
        }
        return `${minutes}m`;
      }
      if (seconds > 0) {
        return `${seconds}s`;
      }
      
      return '0s';  // Default case if all values are 0
    };

    const age = await processWithRateLimit(getAge);
    ageCache.set(address, age); // Cache the result
    return age;
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
    
    // Add delay between batches to respect rate limits
    if (batches.indexOf(batch) < batches.length - 1) {
      await delay(RATE_LIMIT_WINDOW);
    }
  }
  
  return results;
}