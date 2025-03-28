export function logEnvironmentInfo() {
  console.log('Environment Debug Info:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('HELIUS_API_KEY exists:', !!process.env.HELIUS_API_KEY);
  console.log('HELIUS_RPC_URL exists:', !!process.env.HELIUS_RPC_URL);
  console.log('DEFITUNA_API_URL exists:', !!process.env.DEFITUNA_API_URL);
  
  // Log partial key for verification (first 4 chars)
  if (process.env.HELIUS_API_KEY) {
    console.log('HELIUS_API_KEY prefix:', process.env.HELIUS_API_KEY.substring(0, 4));
  }
  
  // Log RPC URL domain for verification
  if (process.env.HELIUS_RPC_URL) {
    try {
      const url = new URL(process.env.HELIUS_RPC_URL);
      console.log('HELIUS_RPC_URL domain:', url.hostname);
    } catch (e) {
      console.log('HELIUS_RPC_URL parse error:', e.message);
    }
  }
} 