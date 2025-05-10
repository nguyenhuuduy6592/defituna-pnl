import { getFirstTransactionTimestamp } from '../../../../utils/solanaUtils';
import { debouncePromise } from '../../../../utils/debounce';

const debouncedGetFirstTransactionTimestamp = debouncePromise(getFirstTransactionTimestamp, 250);

export default async function handler(req, res) {
  const { walletAddress } = req.query;

  if (!walletAddress || typeof walletAddress !== 'string') {
    return res.status(400).json({ message: 'Wallet address is required and must be a string.' });
  }

  if (!process.env.DEFITUNA_API_URL) {
    console.error('DEFITUNA_API_URL is not set.');
    return res.status(500).json({ message: 'API URL configuration error.' });
  }

  const targetUrl = `${process.env.DEFITUNA_API_URL}/users/${walletAddress}/lending-positions`;

  try {
    const apiResponse = await fetch(targetUrl);

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error(`API Error (${apiResponse.status}) for ${targetUrl}: ${errorBody}`);
      return res.status(apiResponse.status).json({ message: `Failed to fetch lending positions: ${apiResponse.statusText}`, error: errorBody });
    }

    const data = await apiResponse.json();
    const positions = Array.isArray(data) ? data : data.data || [];
    const now = Math.floor(Date.now() / 1000);

    const positionsWithAge = await Promise.all(
      positions.map(async (pos) => {
        const address = pos.address;
        let age = null;
        if (address) {
          const timestamp = await debouncedGetFirstTransactionTimestamp(address);
          if (timestamp && typeof timestamp === 'number') {
            age = now - timestamp;
            if (age < 0) age = null;
          }
        }
        return { ...pos, address, age };
      })
    );

    return res.status(200).json({ data: positionsWithAge });
  } catch (error) {
    console.error(`Network or other error for ${targetUrl}:`, error);
    return res.status(500).json({ message: 'Error fetching lending positions from upstream API.', error: error.message });
  }
} 