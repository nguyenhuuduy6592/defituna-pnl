import { NextApiRequest, NextApiResponse } from 'next';
import { PriceData, API_ENDPOINTS, CACHE_TTL, getCachedData, setCachedData, fetchWithValidation, priceDataSchema } from '@/utils/api/lending';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mint } = req.query;
  
  if (!mint || typeof mint !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid mint parameter' });
  }

  try {
    // Check cache first
    const cacheKey = `price_data_${mint}`;
    const cachedData = getCachedData<PriceData>(cacheKey, CACHE_TTL.PRICE_DATA);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Fetch fresh data
    const priceData = await fetchWithValidation<PriceData>(
      API_ENDPOINTS.PRICE_DATA(mint),
      priceDataSchema
    );

    // Cache the results
    setCachedData(cacheKey, priceData);

    return res.status(200).json(priceData);
  } catch (error) {
    console.error('Price Data API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch price data' });
  }
} 