import { NextApiRequest, NextApiResponse } from 'next';
import { TokenInfo, API_ENDPOINTS, CACHE_TTL, getCachedData, setCachedData, fetchWithValidation, tokenInfoResponseSchema } from '@/utils/api/lending';
import { z } from 'zod';

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
    const cacheKey = `token_info_${mint}`;
    const cachedData = getCachedData<TokenInfo>(cacheKey, CACHE_TTL.TOKEN_METADATA);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Fetch fresh data
    const response = await fetchWithValidation<z.infer<typeof tokenInfoResponseSchema>>(
      API_ENDPOINTS.TOKEN_INFO(mint),
      tokenInfoResponseSchema
    );

    // Cache the results
    setCachedData(cacheKey, response.data);

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Token Info API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch token info' });
  }
} 