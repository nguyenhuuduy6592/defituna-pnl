import { addWalletAddressToPositions, decodePositions, decodeValue } from '@/utils/positionUtils';

export const fetchWalletPnL = async (walletAddress) => {
  if (!walletAddress) return null;
  try {
    const res = await fetch('/api/fetch-pnl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.error(`Error fetching for ${walletAddress}:`, errorData);
      throw new Error(errorData.error || `Failed to fetch data for ${walletAddress}`);
    }
    
    const data = await res.json();
    
    // Decode the total PnL value (using same USD_MULTIPLIER = 100)
    if (data.t_pnl !== undefined) {
      data.totalPnL = decodeValue(data.t_pnl, 100);
      delete data.t_pnl; // Remove the encoded field
    }
    
    // First decode the numeric encoded values in positions
    if (data && data.positions) {
      data.positions = decodePositions(data.positions);
    }
    
    // Then add the wallet address to each position (was removed from server response)
    if (data && data.positions) {
      data.positions = addWalletAddressToPositions(data.positions, walletAddress);
    }
    
    return data;
  } catch (err) {
    console.error(`Caught error fetching for ${walletAddress}:`, err);
    return { error: err.message || 'Unknown error fetching wallet data' }; 
  }
}; 