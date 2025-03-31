import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to fetch and manage pools data
 * @param {Object} options - Configuration options
 * @param {boolean} options.initialFetch - Whether to fetch data on mount (default: true)
 * @param {string} options.sortBy - Field to sort by (default: 'tvl')
 * @param {string} options.sortOrder - Sort order ('asc' or 'desc', default: 'desc')
 * @param {string} options.token - Token filter (optional)
 * @param {string} options.provider - Provider filter (optional)
 * @param {number} options.minTvl - Minimum TVL filter (optional)
 * @returns {Object} Pools data state and control functions
 */
export default function usePoolsData({
  initialFetch = true,
  sortBy = 'tvl',
  sortOrder = 'desc',
  token = '',
  provider = '',
  minTvl = 0
} = {}) {
  // State
  const [poolsData, setPoolsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    sortBy,
    sortOrder,
    token,
    provider,
    minTvl
  });

  // Function to fetch pools data
  const fetchPools = useCallback(async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Combine current filters with any custom filters
      const appliedFilters = { ...filters, ...customFilters };
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (appliedFilters.sortBy) queryParams.append('sort', appliedFilters.sortBy);
      if (appliedFilters.sortOrder) queryParams.append('order', appliedFilters.sortOrder);
      if (appliedFilters.token) queryParams.append('token', appliedFilters.token);
      if (appliedFilters.provider) queryParams.append('provider', appliedFilters.provider);
      if (appliedFilters.minTvl > 0) queryParams.append('minTvl', appliedFilters.minTvl);
      
      // Fetch data from API
      const url = `/api/pools?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pools data');
      }
      
      const data = await response.json();
      
      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid data format received from API');
      }
      
      setPoolsData(data.data);
      
      // Update filters state if custom filters were used
      if (Object.keys(customFilters).length > 0) {
        setFilters(prevFilters => ({ ...prevFilters, ...customFilters }));
      }
    } catch (err) {
      console.error('Error fetching pools data:', err);
      setError(err.message || 'Failed to fetch pools data');
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // Apply filters and refetch data
  const applyFilters = useCallback((newFilters) => {
    fetchPools(newFilters);
  }, [fetchPools]);
  
  // Initial fetch on mount if enabled
  useEffect(() => {
    if (initialFetch) {
      fetchPools();
    }
  }, [initialFetch, fetchPools]);
  
  return {
    pools: poolsData,
    loading,
    error,
    filters,
    fetchPools,
    applyFilters
  };
} 