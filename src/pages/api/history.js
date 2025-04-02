import { fetchTransactionSignatures } from '../../utils/helius';
import { isValidWalletAddress } from '../../utils/validation';

/**
 * API route handler to fetch recent transaction SIGNATURES for a wallet.
 * Returns only the signature information, not full details.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { walletAddress } = req.query;
  // Optionally allow overriding the limit via query param, otherwise default used in function
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined; 

  if (!walletAddress || typeof walletAddress !== 'string' || !isValidWalletAddress(walletAddress)) {
    return res.status(400).json({ error: 'Valid walletAddress query parameter is required' });
  }

  try {
    // Call the utility function to get signature info (uses default limit of 20 if not provided)
    const signatureInfoList = await fetchTransactionSignatures(walletAddress, limit);
    
    // Cache control - signature list is less volatile than details maybe?
    // Let's keep it short for now.
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    // Return the list of signature information objects
    return res.status(200).json(signatureInfoList);

  } catch (error) {
    console.error(`[API /api/history] Error fetching signatures for ${walletAddress}:`, error);
    // Don't expose detailed errors to the client
    return res.status(500).json({ error: 'Failed to fetch transaction signatures' });
  }
} 