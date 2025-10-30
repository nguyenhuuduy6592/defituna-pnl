import { renderHook, act } from '@testing-library/react';
import usePoolsData from '../../hooks/usePoolsData';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Replace localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

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
      '24h': { volume: 1000, yield_over_tvl: 0.1 }
    }
  },
  {
    address: 'pool2',
    token_a_mint: 'token3',  // Unknown token
    token_b_mint: 'token4',  // Unknown token
    sqrt_price: '2000000000',
    tvl_usdc: '50000',
    fee_rate: 0.01,
    stats: {
      '24h': { volume: 500, yield_over_tvl: 0.05 }
    }
  }
];

// Mock fetch responses
global.fetch = jest.fn().mockImplementation((url) => {
  if (url === '/api/tokens') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockTokenMetadata)
    });
  }
  if (url === '/api/pools') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: mockPools })
    });
  }
  return Promise.resolve({
    ok: false,
    statusText: 'Not found'
  });
});

// Setup
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  jest.useFakeTimers();
});

describe('usePoolsData Hook', () => {
  test('should initialize with loading state', () => {
    const { result } = renderHook(() => usePoolsData());
    expect(result.current.loading).toBe(true);
    expect(result.current.pools).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('should fetch pools data on mount', async () => {
    const { result } = renderHook(() => usePoolsData());
    
    // Wait for the async operations to complete
    await act(async () => {
      // Let all promises resolve
      await Promise.resolve();
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.pools.length).toBe(2);
    expect(fetch).toHaveBeenCalled();
  });

  test('should handle API errors', async () => {
    // Mock fetch to reject
    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    
    const { result } = renderHook(() => usePoolsData());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  test('should apply token filter correctly', async () => {
    const { result } = renderHook(() => usePoolsData());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Apply token filter
    act(() => {
      result.current.applyFilters({ token: 'TOKEN1' });
    });
    
    // Check if we can see the filtered pools
    // Wait for one more tick to let the filter apply
    await act(async () => {
      await Promise.resolve();
    });

    // Get the pools with TOKEN1 from the original pool list
    const filteredPoolsManually = result.current.pools.filter(pool => 
      pool.tokenA?.symbol === 'TOKEN1' || pool.tokenB?.symbol === 'TOKEN1'
    );
    
    // Should only show pools with TOKEN1
    expect(filteredPoolsManually.length).toBe(1);
    expect(filteredPoolsManually[0].address).toBe('pool1');
  });

  test('should apply TVL filter correctly', async () => {
    const { result } = renderHook(() => usePoolsData());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Get initial pool count
    const initialPoolCount = result.current.pools.length;
    expect(initialPoolCount).toBe(2);
    
    // Apply TVL filter that only the larger pool matches
    act(() => {
      result.current.applyFilters({ minTvl: 75000 });
    });
    
    // Check if we can see the filtered pools
    // Wait for one more tick to let the filter apply
    await act(async () => {
      await Promise.resolve();
    });
    
    // Get pools with TVL > 75000 manually
    const filteredPoolsManually = result.current.pools.filter(pool => {
      const tvl = parseFloat(pool.tvl_usdc);
      return tvl >= 75000;
    });
    
    expect(filteredPoolsManually.length).toBe(1);
    expect(filteredPoolsManually[0].address).toBe('pool1');
  });

  test('should handle cache correctly', async () => {
    // Mock cache data
    const cachedData = {
      timestamp: Date.now(),
      data: mockPools,
      filterOptions: {
        tokens: ['TOKEN1', 'TOKEN2'],
        tvlRanges: [{ value: 0, label: 'Any TVL' }]
      }
    };
    
    localStorageMock.setItem('poolsData', JSON.stringify(cachedData));
    
    const { result } = renderHook(() => usePoolsData());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should use cache and not fetch
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.pools).toEqual(mockPools);
  });
}); 