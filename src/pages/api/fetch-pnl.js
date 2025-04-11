import { fetchPositions, processPositionsData } from '@/utils/defituna';
import { isValidWalletAddress } from '@/utils/validation';

// Use the same multiplier as in defituna.js
const USD_MULTIPLIER = 100; // Convert dollars to cents (2 decimal places)

// Function to encode decimal values as integers to reduce payload size
function encodeValue(value, multiplier) {
  if (value === null || value === undefined || value === Infinity || value === -Infinity || isNaN(value)) {
    return null;
  }
  return Math.round(value * multiplier);
}

// Function to decode values (needed for calculating correct totalPnL)
function decodeValue(value, multiplier) {
  if (value === null || value === undefined) return null;
  return value / multiplier;
}

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

  // Calculate total PnL from the decoded values to avoid double encoding
  // First decode each position's PnL, then sum them up, then encode the final result
  const totalPnL = positions.reduce((sum, p) => {
    // Decode the encoded p.pnl.u to get the actual value before summing
    const decodedPnl = decodeValue(p.pnl?.u || 0, USD_MULTIPLIER);
    return sum + decodedPnl;
  }, 0);
  
  return { 
    t_pnl: encodeValue(totalPnL, USD_MULTIPLIER), // Encode the totalPnL value correctly
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