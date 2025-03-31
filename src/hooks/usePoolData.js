import { useState, useEffect, useCallback } from 'react';

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// In-memory cache for pool data
const poolCache = new Map();

/**
 * Custom hook for fetching and managing pool data with derived metrics
 * @param {string} poolAddress - The address of the pool to fetch
 * @param {string} timeframe - The timeframe for metrics ('24h', '7d', '30d')
 * @returns {Object} Pool data and loading/error states
 */
export const usePoolData = (poolAddress, timeframe = '24h') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPoolData = useCallback(async () => {
    if (!poolAddress) {
      setData(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cachedData = poolCache.get(poolAddress);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      setData(cachedData.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/pools?poolAddress=${poolAddress}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pool data');
      }

      const responseData = await response.json();
      
      // Extract the first pool from the data array
      const poolData = responseData.data?.[0] || null;
      
      if (!poolData) {
        throw new Error('Pool data not found');
      }
      
      // Update cache
      poolCache.set(poolAddress, {
        data: poolData,
        timestamp: Date.now()
      });

      setData(poolData);
    } catch (err) {
      console.error('Error fetching pool data:', err);
      setError(err.message || 'Failed to fetch pool data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [poolAddress]);

  // Fetch data on mount and when poolAddress changes
  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  // Function to manually refresh the data
  const refresh = useCallback(() => {
    // Clear cache for this pool
    poolCache.delete(poolAddress);
    fetchPoolData();
  }, [poolAddress, fetchPoolData]);

  return {
    data,
    loading,
    error,
    refresh,
    // Convenience getters for derived metrics
    metrics: data?.metrics?.[timeframe] || null,
    feeAPR: data?.metrics?.[timeframe]?.feeAPR || 0,
    volumeTVLRatio: data?.metrics?.[timeframe]?.volumeTVLRatio || 0,
    volatility: data?.metrics?.[timeframe]?.volatility || 'low'
  };
}; 