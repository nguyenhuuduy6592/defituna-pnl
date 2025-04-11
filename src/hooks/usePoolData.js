import { useState, useEffect } from 'react';
import usePoolsData from '@/hooks/usePoolsData';

/**
 * Custom hook for managing pool data with derived metrics
 * @param {string} poolAddress - The address of the pool to fetch
 * @param {string} timeframe - The timeframe for metrics ('24h', '7d', '30d')
 * @returns {Object} Pool data and loading/error states
 */
export const usePoolData = (poolAddress, timeframe = '24h') => {
  const { pools, loading: poolsLoading, error: poolsError } = usePoolsData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!poolAddress) {
      setData(null);
      setLoading(false);
      return;
    }

    if (poolsLoading) {
      setLoading(true);
      return;
    }

    if (poolsError) {
      setError(poolsError);
      setLoading(false);
      return;
    }

    try {
      // Find the pool in the pools data
      const poolData = pools.find(pool => pool.address === poolAddress);
      
      if (!poolData) {
        throw new Error('Pool not found');
      }
      
      setData(poolData);
      setError(null);
    } catch (err) {
      console.error('Error finding pool data:', err);
      setError(err.message || 'Failed to find pool data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [poolAddress, pools, poolsLoading, poolsError]);

  return {
    data,
    loading,
    error,
    // Convenience getters for derived metrics
    metrics: data?.metrics?.[timeframe] || null,
    feeAPR: data?.metrics?.[timeframe]?.feeAPR || 0,
    volumeTVLRatio: data?.metrics?.[timeframe]?.volumeTVLRatio || 0,
    volatility: data?.metrics?.[timeframe]?.volatility || 'low'
  };
}; 