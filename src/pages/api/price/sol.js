import { fetchWithTimeout } from '../../../utils/api';

const CACHE_TTL = 1 * 60 * 1000; // 1 minute in milliseconds

let cachedSolPrice = null;
let lastFetchTime = 0;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.DEFITUNA_API_URL) {
    console.error('DEFITUNA_API_URL is not set.');
    return res.status(500).json({ message: 'API URL configuration error.' });
  }

  const targetUrl = `${process.env.DEFITUNA_API_URL}/oracle-prices/So11111111111111111111111111111111111111112`;

  const now = Date.now();

  // Check cache first
  if (cachedSolPrice && (now - lastFetchTime < CACHE_TTL)) {
    return res.status(200).json({
      price: cachedSolPrice,
      timestamp: lastFetchTime,
      source: 'cache'
    });
  }

  try {
    const response = await fetchWithTimeout(targetUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!data?.data?.price || !data?.data?.decimals) {
      throw new Error('Invalid price data from API');
    }

    cachedSolPrice = Number(data?.data?.price || 0) / 10 ** data?.data?.decimals;
    lastFetchTime = now;

    res.status(200).json({
      price: cachedSolPrice,
      timestamp: lastFetchTime,
    });
  } catch (error) {
    console.error('[/api/price/sol] Error:', error);
    // Don't return cached data on error, let client handle it or try again
    res.status(500).json({ error: 'Failed to fetch SOL price from CoinGecko' });
  }
} 