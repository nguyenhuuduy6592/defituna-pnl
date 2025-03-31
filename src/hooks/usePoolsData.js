import { useState, useEffect, useCallback, useMemo } from 'react';
import { calculatePriceFromSqrtPrice } from '../utils/tokens';

// In-memory cache for token metadata
let tokenMetadataCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Default filter options
const DEFAULT_FILTER_OPTIONS = {
  tokens: [],
  tvlRanges: [
    { value: 0, label: 'Any TVL' },
    { value: 10000, label: '$10K+' },
    { value: 50000, label: '$50K+' },
    { value: 100000, label: '$100K+' },
    { value: 250000, label: '$250K+' },
    { value: 500000, label: '$500K+' },
    { value: 1000000, label: '$1M+' },
    { value: 5000000, label: '$5M+' }
  ]
};

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
    minTvl: 0,
    timeframe: '24h'
  });

  // Filter options state with default values
  const [filterOptions, setFilterOptions] = useState(DEFAULT_FILTER_OPTIONS);

  const fetchTokenMetadata = useCallback(async () => {
    // Return cached data if it's still valid
    if (tokenMetadataCache && Date.now() - lastFetchTime < CACHE_TTL) {
      return tokenMetadataCache;
    }

    try {
      const tokenResponse = await fetch('/api/tokens');
      if (!tokenResponse.ok) {
        throw new Error('Failed to fetch token metadata');
      }
      const metadata = await tokenResponse.json();
      
      // Update cache
      tokenMetadataCache = metadata;
      lastFetchTime = Date.now();
      
      return metadata;
    } catch (err) {
      console.error('Error fetching token metadata:', err);
      return {};
    }
  }, []);

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch token metadata with caching
      const tokenMetadata = await fetchTokenMetadata();

      // Fetch pools data
      const poolsResponse = await fetch('/api/pools');
      if (!poolsResponse.ok) {
        throw new Error('Failed to fetch pools');
      }

      const { data } = await poolsResponse.json();

      // Enhance pools with token metadata
      const enhancedPools = data.map(pool => {
        try {
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
        } catch (err) {
          console.error('Error enhancing pool:', pool.address, err);
          // Return pool without enhancement on error
          return pool;
        }
      });

      setPools(enhancedPools);

      // Update filter options from the total pool list
      const tokens = new Set();
      const tvlValues = [];

      enhancedPools.forEach(pool => {
        if (pool.tokenA?.symbol) tokens.add(pool.tokenA.symbol);
        if (pool.tokenB?.symbol) tokens.add(pool.tokenB.symbol);
        if (pool.tvl_usdc) tvlValues.push(pool.tvl_usdc);
      });

      // Create TVL ranges
      const sortedTvl = tvlValues.sort((a, b) => a - b);
      const minTvl = Math.floor(sortedTvl[0] / 1000) * 1000;
      const maxTvl = Math.ceil(sortedTvl[sortedTvl.length - 1] / 1000) * 1000;

      const tvlRanges = [
        { value: 0, label: 'Any TVL' },
        { value: 10000, label: '$10K+' },
        { value: 50000, label: '$50K+' },
        { value: 100000, label: '$100K+' },
        { value: 250000, label: '$250K+' },
        { value: 500000, label: '$500K+' },
        { value: 1000000, label: '$1M+' },
        { value: 5000000, label: '$5M+' }
      ].filter(range => range.value <= maxTvl);

      setFilterOptions({
        tokens: Array.from(tokens).sort(),
        tvlRanges
      });

    } catch (err) {
      console.error('Error fetching pools:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchTokenMetadata]);

  // Initial fetch
  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  // Apply filters and sorting
  const filteredAndSortedPools = useMemo(() => {
    let result = [...pools];

    // Apply token filter
    if (filters.token) {
      result = result.filter(pool => 
        pool.tokenA?.symbol?.toLowerCase() === filters.token.toLowerCase() ||
        pool.tokenB?.symbol?.toLowerCase() === filters.token.toLowerCase()
      );
    }

    // Apply TVL filter
    if (filters.minTvl > 0) {
      result = result.filter(pool => 
        pool.tvl_usdc >= filters.minTvl
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      result.sort((a, b) => {
        const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
        
        // Handle timeframe-based sorting
        if (filters.sortBy.startsWith('volume') || filters.sortBy.startsWith('yield_over_tvl')) {
          // More robust timeframe extraction
          let timeframe = '';
          let metricName = '';
          
          // Find which timeframe is in the sortBy string
          if (filters.sortBy.includes('24h')) {
            timeframe = '24h';
            metricName = filters.sortBy.replace('24h', '');
          } else if (filters.sortBy.includes('7d')) {
            timeframe = '7d';
            metricName = filters.sortBy.replace('7d', '');
          } else if (filters.sortBy.includes('30d')) {
            timeframe = '30d';
            metricName = filters.sortBy.replace('30d', '');
          }
          
          const aValue = a.stats?.[timeframe]?.[metricName] || 0;
          const bValue = b.stats?.[timeframe]?.[metricName] || 0;
          
          return (aValue - bValue) * multiplier;
        }
        
        // Handle fee sorting
        if (filters.sortBy === 'fee') {
          const aValue = a.fee_rate || 0;
          const bValue = b.fee_rate || 0;
          return (aValue - bValue) * multiplier;
        }
        
        // Handle TVL sorting
        if (filters.sortBy === 'tvl') {
          const aValue = a.tvl_usdc || 0;
          const bValue = b.tvl_usdc || 0;
          return (aValue - bValue) * multiplier;
        }

        // Default string comparison
        const aValue = a[filters.sortBy];
        const bValue = b[filters.sortBy];
        return String(aValue).localeCompare(String(bValue)) * multiplier;
      });
    }

    return result;
  }, [pools, filters]);

  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return { 
    pools: filteredAndSortedPools, 
    loading, 
    error, 
    filters,
    filterOptions,
    applyFilters,
    refresh: fetchPools
  };
} 