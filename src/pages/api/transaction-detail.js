import { fetchWithRetry } from '../../utils/helius';

/**
 * API route handler to fetch details for a single transaction signature.
 * Acts as a secure proxy to the Helius API for the getTransaction method.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { signature } = req.query;

  // Basic validation for signature format (length)
  if (!signature || typeof signature !== 'string' || signature.length < 80 || signature.length > 90) {
    return res.status(400).json({ error: 'Valid signature query parameter is required' });
  }

  try {
    // Use fetchWithRetry to call getTransaction
    const transactionDetails = await fetchWithRetry({
      jsonrpc: '2.0',
      id: `tx-detail-${signature.slice(0, 8)}`,
      method: 'getTransaction',
      params: [
        signature,
        { maxSupportedTransactionVersion: 0 } // Ensure compatibility
      ]
    });

    // Note: fetchWithRetry throws on network/non-429 HTTP errors or exhausted retries.
    // It returns the JSON body on success or for RPC errors within the JSON.
    // We might get { result: null } if the transaction isn't found/indexed yet.

    // Cache control - transaction details are immutable once confirmed.
    // Cache aggressively on CDN and moderately in browser.
    res.setHeader('Cache-Control', 'public, s-maxage=3600, max-age=600'); // 1hr CDN, 10min browser
    
    // Return the entire response from fetchWithRetry (includes result or error field)
    return res.status(200).json(transactionDetails.result); // Only return the result part

  } catch (error) {
    // This catches errors thrown by fetchWithRetry (network, retries exceeded, etc.)
    console.error(`[API /api/transaction-detail] Error fetching details for ${signature}:`, error);
    // Don't expose detailed errors
    return res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
} 