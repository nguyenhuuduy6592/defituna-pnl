import { renderHook } from '@testing-library/react';
import { usePoolData } from '../../hooks/usePoolData';
import usePoolsData from '../../hooks/usePoolsData';

// Mock usePoolsData hook
jest.mock('../../hooks/usePoolsData');

// Mock data
const mockPool = {
  address: 'pool1',
  tokenA: { symbol: 'TOKEN1', decimals: 9 },
  tokenB: { symbol: 'TOKEN2', decimals: 6 },
  tvl_usdc: '100000',
  metrics: {
    '24h': {
      feeAPR: 0.1,
      volumeTVLRatio: 0.5,
      volatility: 'medium'
    },
    '7d': {
      feeAPR: 0.15,
      volumeTVLRatio: 0.6,
      volatility: 'high'
    },
    '30d': {
      feeAPR: 0.12,
      volumeTVLRatio: 0.4,
      volatility: 'low'
    }
  }
};

describe('usePoolData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should return null data when no pool address is provided', () => {
      usePoolsData.mockReturnValue({
        pools: [mockPool],
        loading: false,
        error: null
      });

      const { result } = renderHook(() => usePoolData(null));

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return loading state while pools are loading', () => {
      usePoolsData.mockReturnValue({
        pools: [],
        loading: true,
        error: null
      });

      const { result } = renderHook(() => usePoolData('pool1'));

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
    });

    it('should handle pools error state', () => {
      const error = new Error('Failed to load pools');
      usePoolsData.mockReturnValue({
        pools: [],
        loading: false,
        error
      });

      const { result } = renderHook(() => usePoolData('pool1'));

      expect(result.current.error).toBe(error);
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
    });
  });

  describe('Pool Data Retrieval', () => {
    it('should find and return the correct pool data', () => {
      usePoolsData.mockReturnValue({
        pools: [mockPool],
        loading: false,
        error: null
      });

      const { result } = renderHook(() => usePoolData('pool1'));

      expect(result.current.data).toEqual(mockPool);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return error when pool is not found', () => {
      usePoolsData.mockReturnValue({
        pools: [mockPool],
        loading: false,
        error: null
      });

      const { result } = renderHook(() => usePoolData('non_existent_pool'));

      expect(result.current.error).toBe('Pool not found');
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Metrics and Timeframes', () => {
    beforeEach(() => {
      usePoolsData.mockReturnValue({
        pools: [mockPool],
        loading: false,
        error: null
      });
    });

    it('should return correct metrics for 24h timeframe', () => {
      const { result } = renderHook(() => usePoolData('pool1', '24h'));

      expect(result.current.metrics).toEqual(mockPool.metrics['24h']);
      expect(result.current.feeAPR).toBe(0.1);
      expect(result.current.volumeTVLRatio).toBe(0.5);
      expect(result.current.volatility).toBe('medium');
    });

    it('should return correct metrics for 7d timeframe', () => {
      const { result } = renderHook(() => usePoolData('pool1', '7d'));

      expect(result.current.metrics).toEqual(mockPool.metrics['7d']);
      expect(result.current.feeAPR).toBe(0.15);
      expect(result.current.volumeTVLRatio).toBe(0.6);
      expect(result.current.volatility).toBe('high');
    });

    it('should return correct metrics for 30d timeframe', () => {
      const { result } = renderHook(() => usePoolData('pool1', '30d'));

      expect(result.current.metrics).toEqual(mockPool.metrics['30d']);
      expect(result.current.feeAPR).toBe(0.12);
      expect(result.current.volumeTVLRatio).toBe(0.4);
      expect(result.current.volatility).toBe('low');
    });

    it('should handle missing metrics gracefully', () => {
      const poolWithoutMetrics = { ...mockPool, metrics: undefined };
      usePoolsData.mockReturnValue({
        pools: [poolWithoutMetrics],
        loading: false,
        error: null
      });

      const { result } = renderHook(() => usePoolData('pool1', '24h'));

      expect(result.current.metrics).toBeNull();
      expect(result.current.feeAPR).toBe(0);
      expect(result.current.volumeTVLRatio).toBe(0);
      expect(result.current.volatility).toBe('low');
    });
  });

  describe('Updates and Re-renders', () => {
    it('should update when pool data changes', () => {
      const { result, rerender } = renderHook(() => usePoolData('pool1'));

      // Initial render
      usePoolsData.mockReturnValue({
        pools: [mockPool],
        loading: false,
        error: null
      });
      rerender();
      expect(result.current.data).toEqual(mockPool);

      // Update pool data
      const updatedPool = {
        ...mockPool,
        tvl_usdc: '200000'
      };
      usePoolsData.mockReturnValue({
        pools: [updatedPool],
        loading: false,
        error: null
      });
      rerender();

      expect(result.current.data).toEqual(updatedPool);
    });

    it('should handle pool address changes', () => {
      const pool2 = { ...mockPool, address: 'pool2' };
      usePoolsData.mockReturnValue({
        pools: [mockPool, pool2],
        loading: false,
        error: null
      });

      const { result, rerender } = renderHook(
        ({ poolAddress }) => usePoolData(poolAddress),
        { initialProps: { poolAddress: 'pool1' } }
      );

      expect(result.current.data.address).toBe('pool1');

      // Change pool address
      rerender({ poolAddress: 'pool2' });
      expect(result.current.data.address).toBe('pool2');
    });
  });
}); 