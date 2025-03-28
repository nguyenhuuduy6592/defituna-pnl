import { getTransactionAges } from '../../utils/helius';
import { fetchPositions, processPositionsData } from '../../utils/defituna';

// Debug logging for environment variables
const logEnvironmentInfo = () => {
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
};

async function getAges(positions) {
  // Log environment info at the start of each request
  logEnvironmentInfo();

  if (!positions || !Array.isArray(positions) || positions.length === 0) {
    console.error('Invalid positions array:', positions);
    return [];
  }

  try {
    // Validate positions have the required address property
    const validPositions = positions.filter(p => p && p.address);
    if (validPositions.length === 0) {
      console.error('No valid positions found with address property');
      return positions.map(() => 'Unknown');
    }

    console.log('Fetching ages for positions:', validPositions.length);

    // Use Helius RPC with batch processing
    const ages = await getTransactionAges(validPositions.map(p => p.address));
    
    console.log('Successfully fetched ages for positions:', ages.size);
    
    // Map results back to all positions
    return positions.map(pos => {
      if (!pos || !pos.address) return 'Unknown';
      const age = ages.get(pos.address) || 'Unknown';
      console.log(`Position ${pos.address.slice(0, 6)}... age:`, age);
      return age;
    });
  } catch (error) {
    console.error('Error getting ages:', error);
    console.error('Error stack:', error.stack);
    return positions.map(() => 'Unknown');
  }
}

async function fetchPnL(wallet) {
  if (!wallet) {
    throw new Error('Wallet address is required');
  }

  // Fetch positions data
  const positionsData = await fetchPositions(wallet);

  // Get ages for positions
  const positionAges = await getAges(positionsData);
  
  // Process positions data with ages
  const positions = await processPositionsData(positionsData, positionAges);
  
  // Calculate total PnL
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  
  return { 
    totalPnL,
    positions, 
  };
}

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress } = req.body;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  // Validate wallet address format
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress.trim())) {
    return res.status(400).json({ error: 'Invalid Solana wallet address format' });
  }

  try {
    const result = await fetchPnL(walletAddress.trim());
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in fetch-pnl:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};