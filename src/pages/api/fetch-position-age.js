import { getTransactionAges } from '../../utils/helius';
import { isValidWalletAddress } from '../../utils/validation'; // Assuming position addresses are like wallet addresses

/**
 * Fetches the age (creation timestamp) for a list of position addresses.
 * @param {string[]} positionAddresses - An array of position addresses.
 * @returns {Promise<Map<string, number|0>>} A map of positionAddress to creationTimestamp (Unix timestamp in seconds, or 0 on error).
 */
async function getPositionCreationTimestamps(positionAddresses) {
  if (!Array.isArray(positionAddresses) || positionAddresses.length === 0) {
    return new Map();
  }

  // Basic validation (optional, adjust if needed)
  const validAddresses = positionAddresses.filter(addr => isValidWalletAddress(addr)); 
  if (validAddresses.length === 0) {
    console.warn('No valid position addresses provided to getPositionCreationTimestamps');
    return new Map();
  }

  try {
    // Use Helius RPC (now returns timestamps)
    const timestampsMap = await getTransactionAges(validAddresses);
    
    // Ensure all original addresses have an entry
    const finalTimestamps = new Map();
    positionAddresses.forEach(addr => {
      // Use the timestamp if valid (> 0), otherwise default to 0
      const ts = timestampsMap.get(addr);
      finalTimestamps.set(addr, typeof ts === 'number' && ts > 0 ? ts : 0);
    });
    return finalTimestamps;

  } catch (error) {
    console.error('Error getting position timestamps:', error);
    // Return a map with 0 for all requested addresses on error
    const errorMap = new Map();
    positionAddresses.forEach(addr => errorMap.set(addr, 0));
    return errorMap;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { positionAddresses } = req.body;

    if (!Array.isArray(positionAddresses)) {
       return res.status(400).json({ error: 'positionAddresses must be an array' });
    }

    const timestampsMap = await getPositionCreationTimestamps(positionAddresses);

    // Convert Map to a serializable object for JSON response
    const timestampsObject = Object.fromEntries(timestampsMap);
    
    res.status(200).json(timestampsObject);

  } catch (error) {
    console.error('Error in fetch-position-age:', error);
    res.status(500).json({ 
      error: 'Failed to fetch position ages',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 