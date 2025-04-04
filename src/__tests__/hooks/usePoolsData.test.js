import { renderHook, act } from '@testing-library/react';
import usePoolsData from '../../hooks/usePoolsData';

// Mock data
const mockTokenMetadata = {
  'token1': { symbol: 'TOKEN1', decimals: 9 },
  'token2': { symbol: 'TOKEN2', decimals: 6 }
};

const mockPools = [
  {
    address: 'pool1',
    token_a_mint: 'token1',
    token_b_mint: 'token2',
    sqrt_price: '1000000000',
    tvl_usdc: '100000',
    fee_rate: 0.003,
    stats: {
      '24h': { volume: 1000, yield_over_tvl: 0.1 },
      '7d': { volume: 5000, yield_over_tvl: 0.15 },
      '30d': { volume: 15000, yield_over_tvl: 0.2 }
    }
  }
];

// Mock fetch responses
const mockResponses = {
  '/api/tokens': mockTokenMetadata,
  '/api/pools': { data: mockPools }
};

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = jest.fn((url) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockResponses[url])
  })
);

describe('usePoolsData Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => usePoolsData());

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.pools).toEqual([]);
      expect(result.current.filters).toEqual({
        sortBy: 'tvl',
        sortOrder: 'desc',
        token: '',
        minTvl: 0,
        timeframe: '24h'
      });
    });

    it('should load data from cache if available', async () => {
      const cachedData = {
        timestamp: Date.now(),
        data: mockPools,
        filterOptions: {
          tokens: ['TOKEN1', 'TOKEN2'],
          tvlRanges: [{ value: 0, label: 'Any TVL' }]
        }
      };
      localStorageMock.setItem('poolsData', JSON.stringify(cachedData));

      const { result, waitForNextUpdate } = renderHook(() => usePoolsData());
      await waitForNextUpdate();

      expect(result.current.pools).toEqual(mockPools);
      expect(result.current.loading).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch fresh data if cache is expired', async () => {
      const expiredCache = {
        timestamp: Date.now() - (61 * 60 * 1000), // 61 minutes old
        data: mockPools,
        filterOptions: {
          tokens: ['TOKEN1', 'TOKEN2'],
          tvlRanges: [{ value: 0, label: 'Any TVL' }]
        }
      };
      localStorageMock.setItem('poolsData', JSON.stringify(expiredCache));

      const { result, waitForNextUpdate } = renderHook(() => usePoolsData());
      await waitForNextUpdate();

      expect(fetch).toHaveBeenCalledTimes(2); // Tokens and pools
      expect(result.current.loading).toBe(false);
      expect(result.current.pools.length).toBeGreaterThan(0);
    });
  });

  describe('Data Fetching', () => {
    it('should handle successful API responses', async () => {
      const { result, waitForNextUpdate } = renderHook(() => usePoolsData());
      await waitForNextUpdate();

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            address: 'pool1',
            tokenA: expect.objectContaining({ symbol: 'TOKEN1' }),
            tokenB: expect.objectContaining({ symbol: 'TOKEN2' })
          })
        ])
      );
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => Promise.reject(new Error('API Error')));

      const { result, waitForNextUpdate } = renderHook(() => usePoolsData());
      await waitForNextUpdate();

      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
      expect(result.current.pools).toEqual([]);
    });
  });

  describe('Filtering and Sorting', () => {
    it('should apply token filters correctly', async () => {
      const { result, waitForNextUpdate } = renderHook(() => usePoolsData());
      await waitForNextUpdate();

      act(() => {
        result.current.applyFilters({ token: 'TOKEN1' });
      });

      expect(result.current.pools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tokenA: expect.objectContaining({ symbol: 'TOKEN1' })
          })
        ])
      );
    });

    it('should apply TVL filters correctly', async () => {
      const { result, waitForNextUpdate } = renderHook(() => usePoolsData());
      await waitForNextUpdate();

      act(() => {
        result.current.applyFilters({ minTvl: 50000 });
      });

      expect(result.current.pools.every(pool => parseFloat(pool.tvl_usdc) >= 50000)).toBe(true);
    });

    it('should sort pools correctly', async () => {
      const { result, waitForNextUpdate } = renderHook(() => usePoolsData());
      await waitForNextUpdate();

      act(() => {
        result.current.applyFilters({ sortBy: 'tvl', sortOrder: 'desc' });
      });

      const pools = result.current.pools;
      for (let i = 1; i < pools.length; i++) {
        expect(parseFloat(pools[i-1].tvl_usdc)).toBeGreaterThanOrEqual(parseFloat(pools[i].tvl_usdc));
      }
    });
  });

  describe('Refresh Functionality', () => {
    it('should force refresh data when called', async () => {
      const { result, waitForNextUpdate } = renderHook(() => usePoolsData());
      await waitForNextUpdate();

      // Clear previous fetch calls
      fetch.mockClear();

      // Trigger refresh
      act(() => {
        result.current.refresh();
      });

      await waitForNextUpdate();

      expect(fetch).toHaveBeenCalledTimes(2); // Tokens and pools
      expect(result.current.loading).toBe(false);
    });
  });
}); 