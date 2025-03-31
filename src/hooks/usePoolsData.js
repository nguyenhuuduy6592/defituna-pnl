import { useState, useEffect, useCallback } from 'react';
import { calculatePriceFromSqrtPrice } from '../utils/tokens';

/**
 * Custom hook to fetch and manage pools data
 * @returns {Object} Pools data state and control functions
 */
export default function usePoolsData() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    sortBy: 'tvl',
    sortOrder: 'desc',
    token: '',
    provider: '',
    minTvl: 0
  });

  const fetchPools = useCallback(async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch token metadata first
      const tokenResponse = await fetch('/api/tokens');
      if (!tokenResponse.ok) {
        throw new Error('Failed to fetch token metadata');
      }
      const tokenMetadata = await tokenResponse.json();

      // Build query string from filters
      const queryParams = new URLSearchParams();
      const appliedFilters = { ...filters, ...customFilters };
      
      if (appliedFilters.sortBy) queryParams.append('sort', appliedFilters.sortBy);
      if (appliedFilters.sortOrder) queryParams.append('order', appliedFilters.sortOrder);
      if (appliedFilters.token) queryParams.append('token', appliedFilters.token);
      if (appliedFilters.provider) queryParams.append('provider', appliedFilters.provider);
      if (appliedFilters.minTvl > 0) queryParams.append('minTvl', appliedFilters.minTvl);

      // Fetch pools data
      const poolsResponse = await fetch(`/api/pools?${queryParams.toString()}`);
      if (!poolsResponse.ok) {
        throw new Error('Failed to fetch pools');
      }

      const { data } = await poolsResponse.json();

      // Enhance pools with token metadata
      const enhancedPools = data.map(pool => {
        const tokenA = tokenMetadata[pool.token_a_mint] || {
          symbol: pool.token_a_mint.slice(0, 4) + '...' + pool.token_a_mint.slice(-4),
          decimals: 9
        };
        const tokenB = tokenMetadata[pool.token_b_mint] || {
          symbol: pool.token_b_mint.slice(0, 4) + '...' + pool.token_b_mint.slice(-4),
          decimals: 9
        };

        const currentPrice = calculatePriceFromSqrtPrice(
          pool.sqrt_price,
          tokenA.decimals,
          tokenB.decimals
        );

        return {
          ...pool,
          tokenA,
          tokenB,
          currentPrice
        };
      });

      setPools(enhancedPools);
      
      // Update filters if custom filters were provided
      if (Object.keys(customFilters).length > 0) {
        setFilters(prev => ({ ...prev, ...customFilters }));
      }
    } catch (err) {
      console.error('Error fetching pools:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const applyFilters = useCallback((newFilters) => {
    fetchPools(newFilters);
  }, [fetchPools]);

  return { 
    pools, 
    loading, 
    error, 
    filters,
    applyFilters
  };
} 