import { fetchAllPools } from '../../utils/defituna';

/**
 * API endpoint to fetch all available pools 
 * Supports optional query parameters for filtering
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all pools data
    const poolsData = await fetchAllPools();
    
    // If we don't have data or it's not in the expected format
    if (!poolsData || !poolsData.data || !Array.isArray(poolsData.data)) {
      return res.status(500).json({ 
        error: 'Invalid pools data received',
        details: 'The API returned data in an unexpected format'
      });
    }
    
    // Apply any filtering from query parameters
    let filteredPools = poolsData.data;
    const { query } = req;
    
    // Filter by token if specified
    if (query.token) {
      const tokenSearch = query.token.toLowerCase();
      filteredPools = filteredPools.filter(pool => 
        pool.token_a_mint.toLowerCase().includes(tokenSearch) ||
        pool.token_b_mint.toLowerCase().includes(tokenSearch)
      );
    }
    
    // Filter by provider (e.g., "orca")
    if (query.provider) {
      const providerSearch = query.provider.toLowerCase();
      filteredPools = filteredPools.filter(pool =>
        pool.provider.toLowerCase() === providerSearch
      );
    }
    
    // Filter by minimum TVL
    if (query.minTvl) {
      const minTvl = parseFloat(query.minTvl);
      if (!isNaN(minTvl)) {
        filteredPools = filteredPools.filter(pool => 
          parseFloat(pool.tvl_usdc) >= minTvl
        );
      }
    }
    
    // Sort pools if requested
    if (query.sort) {
      const sortField = query.sort.toLowerCase();
      const sortDirection = query.order?.toLowerCase() === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'tvl':
          filteredPools.sort((a, b) => sortDirection * (parseFloat(b.tvl_usdc) - parseFloat(a.tvl_usdc)));
          break;
        case 'volume24h':
          filteredPools.sort((a, b) => {
            const aVolume = parseFloat(a.stats?.["24h"]?.volume || 0);
            const bVolume = parseFloat(b.stats?.["24h"]?.volume || 0);
            return sortDirection * (bVolume - aVolume);
          });
          break;
        case 'volume7d':
          filteredPools.sort((a, b) => {
            const aVolume = parseFloat(a.stats?.["7d"]?.volume || 0);
            const bVolume = parseFloat(b.stats?.["7d"]?.volume || 0);
            return sortDirection * (bVolume - aVolume);
          });
          break;
        case 'volume30d':
          filteredPools.sort((a, b) => {
            const aVolume = parseFloat(a.stats?.["30d"]?.volume || 0);
            const bVolume = parseFloat(b.stats?.["30d"]?.volume || 0);
            return sortDirection * (bVolume - aVolume);
          });
          break;
        case 'yield24h':
          filteredPools.sort((a, b) => {
            const aYield = parseFloat(a.stats?.["24h"]?.yield_over_tvl || 0);
            const bYield = parseFloat(b.stats?.["24h"]?.yield_over_tvl || 0);
            return sortDirection * (bYield - aYield);
          });
          break;
        case 'yield7d':
          filteredPools.sort((a, b) => {
            const aYield = parseFloat(a.stats?.["7d"]?.yield_over_tvl || 0);
            const bYield = parseFloat(b.stats?.["7d"]?.yield_over_tvl || 0);
            return sortDirection * (bYield - aYield);
          });
          break;
        case 'yield30d':
          filteredPools.sort((a, b) => {
            const aYield = parseFloat(a.stats?.["30d"]?.yield_over_tvl || 0);
            const bYield = parseFloat(b.stats?.["30d"]?.yield_over_tvl || 0);
            return sortDirection * (bYield - aYield);
          });
          break;
        case 'fee':
          filteredPools.sort((a, b) => sortDirection * (b.fee_rate - a.fee_rate));
          break;
      }
    }
    
    // Return the filtered and sorted pools
    res.status(200).json({ data: filteredPools });
  } catch (error) {
    console.error('Error in /api/pools:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch pools data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 