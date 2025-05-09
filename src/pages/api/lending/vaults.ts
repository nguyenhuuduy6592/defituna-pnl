import { NextApiRequest, NextApiResponse } from 'next';
import { 
  VaultData, 
  API_ENDPOINTS, 
  CACHE_TTL, 
  getCachedData, 
  setCachedData, 
  vaultsResponseSchema,
  transformVaultData
} from '@/utils/api/lending';

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
    const response = await fetch(API_ENDPOINTS.VAULTS);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rawData = await response.json();

    // Validate the response
    const validatedResponse = vaultsResponseSchema.parse(rawData);
    
    // Transform the data to our internal format
    const vaults = validatedResponse.data.map(transformVaultData);

    // Cache the results
    setCachedData('vaults', vaults);

    return res.status(200).json(vaults);
  } catch (error) {
    console.error('Vaults API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch vaults data' });
  }
} 