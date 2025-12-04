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
      t_pnl: 0, // Encode field name - totalPnL becomes t_pnl
      positions: [],
      message: 'No positions found for this wallet'
    };
  }

  // Process positions data without ages
  const positions = await processPositionsData(positionsData);

  // Calculate total PnL directly from raw decimal values
  const totalPnL = positions.reduce((sum, p) => {
    // Use raw decimal values directly
    const positionPnl = p.pnl?.u || 0;
    return sum + positionPnl;
  }, 0);

  return {
    t_pnl: totalPnL, // Return raw decimal value
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