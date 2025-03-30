import { fetchPositions, processPositionsData } from '../../utils/defituna';
import { isValidWalletAddress } from '../../utils/validation';

async function fetchPnL(wallet) {
  if (!wallet) {
    throw new Error('Wallet address is required');
  }

  // Fetch positions data
  const positionsData = await fetchPositions(wallet);

  // Handle empty positions case early
  if (!positionsData || !Array.isArray(positionsData) || positionsData.length === 0) {
    return {
      totalPnL: 0,
      positions: [],
      message: 'No positions found for this wallet'
    };
  }

  // Process positions data without ages
  const positions = await processPositionsData(positionsData); // Remove positionAges argument

  // Calculate total PnL
  const totalPnL = positions.reduce((sum, p) => sum + (p.pnl?.usd || 0), 0);
  
  return { 
    totalPnL,
    positions,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.body;

    if (!isValidWalletAddress(walletAddress)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format',
        details: 'Please provide a valid Solana wallet address'
      });
    }

    const result = await fetchPnL(walletAddress.trim());
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in fetch-pnl:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}