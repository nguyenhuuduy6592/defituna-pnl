import axios from 'axios';
import { config } from './config';

/**
 * Fetch token metadata for a list of mint addresses
 * @param {Array<string>} mints Array of token mint addresses
 * @returns {Promise<Object>} Object mapping mint addresses to their metadata
 * 
 * @example
 * // Example return format:
 * {
 *   "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
 *     symbol: "USDC",
 *     decimals: 6
 *   }
 * }
 */
export async function fetchTokenMetadata(mints) {
  const uniqueMints = [...new Set(mints)];
  const metadata = {};
  
  try {
    // Fetch in batches of 100
    for (let i = 0; i < uniqueMints.length; i += 100) {
      const batch = uniqueMints.slice(i, i + 100);
      
      const response = await axios.post(
        `${config.HELIUS_RPC_URL}`, 
        {
          jsonrpc: '2.0',
          id: 'get-assets-batch',
          method: 'getAssetBatch',
          params: { ids: batch }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.HELIUS_API_KEY}`
          }
        }
      );
      
      const assets = response.data.result;
      
      for (const asset of assets) {
        if (asset) {
          metadata[asset.id] = {
            symbol: asset.content?.metadata?.symbol || 'UNKNOWN',
            decimals: asset.content?.metadata?.decimals || 0
          };
        }
      }
      
      // Respect rate limits
      if (uniqueMints.length > 100) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (error) {
    console.error('Error fetching token metadata:', error);
  }
  
  return metadata;
} 