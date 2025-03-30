import { fetchPositions, processPositionsData } from '../../utils/defituna';
import { isValidWalletAddress } from '../../utils/validation';

async function fetchPnL(wallet) {
  console.time(`fetchPnL for ${wallet}`);
  if (!wallet) {
    throw new Error('Wallet address is required');
  }

  // Fetch positions data
  console.time(`fetchPositions for ${wallet}`);
  const positionsData = await fetchPositions(wallet);
  console.timeEnd(`fetchPositions for ${wallet}`);

  // Handle empty positions case early
  if (!positionsData || !Array.isArray(positionsData) || positionsData.length === 0) {
    console.timeEnd(`fetchPnL for ${wallet}`); // End timer early
    return {
      totalPnL: 0,
      positions: [],
      message: 'No positions found for this wallet'
    };
  }

  // Process positions data without ages
  console.time(`processPositionsData for ${wallet} (${positionsData.length} positions)`);
  const positions = await processPositionsData(positionsData);
  console.timeEnd(`processPositionsData for ${wallet} (${positionsData.length} positions)`);

  // Calculate total PnL
  console.time(`calculateTotalPnL for ${wallet}`);
  const totalPnL = positions.reduce((sum, p) => sum + (p.pnl?.usd || 0), 0);
  console.timeEnd(`calculateTotalPnL for ${wallet}`);
  
  console.timeEnd(`fetchPnL for ${wallet}`);
  return { 
    totalPnL,
    positions,
  };
}

export default async function handler(req, res) {
  console.time(`handler /api/fetch-pnl ${req.body?.walletAddress}`);
  if (req.method !== 'POST') {
    console.timeEnd(`handler /api/fetch-pnl ${req.body?.walletAddress}`); // End timer early
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.body;

    if (!isValidWalletAddress(walletAddress)) {
      console.timeEnd(`handler /api/fetch-pnl ${req.body?.walletAddress}`); // End timer early
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
  } finally {
      console.timeEnd(`handler /api/fetch-pnl ${req.body?.walletAddress}`);
  }
}