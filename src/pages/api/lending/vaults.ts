import { NextApiRequest, NextApiResponse } from 'next';
import { VaultData, API_ENDPOINTS, CACHE_TTL, getCachedData, setCachedData, fetchWithValidation, vaultDataSchema } from '@/utils/api/lending';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check cache first
    const cachedData = getCachedData<VaultData[]>('vaults', CACHE_TTL.VAULTS);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Fetch fresh data
    const vaults = await fetchWithValidation<VaultData[]>(
      API_ENDPOINTS.VAULTS,
      vaultDataSchema.array()
    );

    // Cache the results
    setCachedData('vaults', vaults);

    return res.status(200).json(vaults);
  } catch (error) {
    console.error('Vaults API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch vaults data' });
  }
} 