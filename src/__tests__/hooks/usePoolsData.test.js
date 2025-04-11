import { renderHook, act, waitFor } from '@testing-library/react';
import usePoolsData from '@/hooks/usePoolsData';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';
import { calculatePriceFromSqrtPrice } from '@/utils/tokens';

// --- Mocks ---
jest.mock('@/utils/indexedDB', () => ({
  initializeDB: jest.fn(),
  getData: jest.fn(),
  saveData: jest.fn(),
  STORE_NAMES: { 
    POOLS: 'pools',
    SETTINGS: 'settings' // Include other store names if used elsewhere
  },
}));

jest.mock('@/utils/tokens', () => ({
  calculatePriceFromSqrtPrice: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock Date.now for cache testing
const realDateNow = Date.now.bind(global.Date);
const MOCK_INITIAL_TIME = 1700000000000; // A fixed point in time

// --- Mock Data ---
const MOCK_DB = { mockDbInstance: true }; // Simple object to represent DB connection

const MOCK_TOKEN_METADATA = {
  tokenA_mint: { symbol: 'TKA', decimals: 6, name: 'Token A', logo: 'logoA.png' },
  tokenB_mint: { symbol: 'TKB', decimals: 8, name: 'Token B', logo: 'logoB.png' },
  tokenC_mint: { symbol: 'TKC', decimals: 6, name: 'Token C', logo: 'logoC.png' },
};

const MOCK_POOLS_RAW = [
  { 
    address: 'pool1', 
    token_a_mint: 'tokenA_mint', 
    token_b_mint: 'tokenB_mint', 
    sqrt_price: '1234567890', 
    tvl_usdc: '150000', 
    fee_rate: 0.003,
    stats: { 
      '24h': { volume: 10000, fees: 30, yield_over_tvl: 0.0002 },
      '7d': { volume: 70000, fees: 210, yield_over_tvl: 0.0014 },
      '30d': { volume: 300000, fees: 900, yield_over_tvl: 0.006 },
    }
  },
  { 
    address: 'pool2', 
    token_a_mint: 'tokenA_mint', 
    token_b_mint: 'tokenC_mint', 
    sqrt_price: '9876543210', 
    tvl_usdc: '50000', 
    fee_rate: 0.01,
    stats: { 
      '24h': { volume: 5000, fees: 50, yield_over_tvl: 0.001 },
      '7d': { volume: 35000, fees: 350, yield_over_tvl: 0.007 },
      '30d': { volume: 150000, fees: 1500, yield_over_tvl: 0.03 },
    }
  },
  { 
    address: 'pool3', // Lower TVL
    token_a_mint: 'tokenB_mint', 
    token_b_mint: 'tokenC_mint', 
    sqrt_price: '5555555555', 
    tvl_usdc: '5000', 
    fee_rate: 0.005,
    stats: { 
      '24h': { volume: 100, fees: 0.5, yield_over_tvl: 0.0001 },
      '7d': { volume: 700, fees: 3.5, yield_over_tvl: 0.0007 },
      '30d': { volume: 3000, fees: 15, yield_over_tvl: 0.003 },
    }
  },
];

const MOCK_POOLS_API_RESPONSE = { data: MOCK_POOLS_RAW };
const MOCK_TOKENS_API_RESPONSE = MOCK_TOKEN_METADATA;

// Helper to mock fetch responses
const mockFetch = (url, responseData, ok = true, status = 200) => {
  if (url === '/api/pools') {
    fetch.mockResolvedValueOnce({
      ok,
      status,
      json: async () => (responseData),
    });
  } else if (url === '/api/tokens') {
    fetch.mockResolvedValueOnce({
      ok,
      status,
      json: async () => (responseData),
    });
  } else {
     fetch.mockResolvedValueOnce({ // Default for unhandled
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not Found' }),
    });
  }
};

// --- Test Suite ---
describe('usePoolsData Hook', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    fetch.mockClear();
    
    // Reset Date.now mock
    global.Date.now = jest.fn(() => MOCK_INITIAL_TIME);

    // Default successful mock implementations
    initializeDB.mockResolvedValue(MOCK_DB);
    getData.mockResolvedValue(null); // Default: cache miss
    saveData.mockResolvedValue(true);
    calculatePriceFromSqrtPrice.mockImplementation((sqrtPrice, decA, decB) => {
      // Simple mock calculation based on sqrtPrice length for variety
      return sqrtPrice.length === 10 ? 1.5 : 2.5; 
    });
    
    // Mock default API responses using mockImplementation for clarity
    fetch.mockImplementation(url => {
      if (url === '/api/tokens') {
        return Promise.resolve({ ok: true, json: async () => MOCK_TOKENS_API_RESPONSE });
      }
      if (url === '/api/pools') {
        return Promise.resolve({ ok: true, json: async () => MOCK_POOLS_API_RESPONSE });
      }
      // Default fallback for any other URL
      return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: 'Not Found' }) });
    });
  });

  afterEach(() => {
    // Restore original Date.now
    global.Date.now = realDateNow;
  });
  
  // Helper function to render the hook
  const renderPoolsHook = () => renderHook(() => usePoolsData());

  // --- Test Cases ---

  it('should initialize with loading state and fetch data', async () => {
    const { result } = renderPoolsHook();

    expect(result.current.loading).toBe(true);
    expect(result.current.pools).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(initializeDB).toHaveBeenCalledTimes(1); // Called on initial load attempt

    // Wait for loading to finish
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check APIs were called
    expect(fetch).toHaveBeenCalledWith('/api/tokens');
    expect(fetch).toHaveBeenCalledWith('/api/pools');
    
    // Check data is populated and enhanced
    expect(result.current.pools.length).toBe(MOCK_POOLS_RAW.length);
    expect(result.current.pools[0].tokenA).toEqual(MOCK_TOKEN_METADATA.tokenA_mint);
    expect(result.current.pools[0].tokenB).toEqual(MOCK_TOKEN_METADATA.tokenB_mint);
    expect(result.current.pools[0].currentPrice).toBeDefined();
    expect(calculatePriceFromSqrtPrice).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    
    // Check data saved to cache
    expect(saveData).toHaveBeenCalledTimes(1);
    expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.POOLS, {
        key: 'poolsData',
        value: expect.objectContaining({
            timestamp: MOCK_INITIAL_TIME,
            data: expect.any(Array),
            filterOptions: expect.any(Object),
        })
    });
  });

  it('should handle /api/pools fetch error', async () => {
    fetch.mockImplementation(url => {
      if (url === '/api/tokens') {
        return Promise.resolve({ ok: true, json: async () => MOCK_TOKENS_API_RESPONSE });
      }
      if (url === '/api/pools') {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: 'Pools API Down' }) });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: 'Not Found' }) });
    });

    const { result } = renderPoolsHook();

    // Wait for loading to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Now assert the calls and final state
    expect(fetch).toHaveBeenCalledWith('/api/tokens');
    expect(fetch).toHaveBeenCalledWith('/api/pools');
    expect(result.current.pools).toEqual([]);
    expect(result.current.error).toContain('Failed to fetch pools');
    expect(saveData).not.toHaveBeenCalled();
  });
  
  it('should handle /api/tokens fetch error', async () => {
    fetch.mockImplementation(url => {
      if (url === '/api/tokens') {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: 'Tokens API Down' }) });
      }
      if (url === '/api/pools') {
        return Promise.resolve({ ok: true, json: async () => MOCK_POOLS_API_RESPONSE });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: 'Not Found' }) });
    });

    const { result } = renderPoolsHook();

    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(fetch).toHaveBeenCalledWith('/api/tokens');
    expect(fetch).toHaveBeenCalledWith('/api/pools');
    expect(result.current.pools.length).toBe(MOCK_POOLS_RAW.length);
    
    // Check the correct fallback symbol generation
    const expectedFallbackSymbol = MOCK_POOLS_RAW[0].token_a_mint.slice(0, 4) + '...' + MOCK_POOLS_RAW[0].token_a_mint.slice(-4);
    expect(result.current.pools[0].tokenA.symbol).toBe(expectedFallbackSymbol); 
    expect(result.current.pools[0].tokenA.decimals).toBe(9); // Check fallback decimal
    expect(calculatePriceFromSqrtPrice).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(saveData).toHaveBeenCalled();
  });

  // --- Cache Tests ---

  it('should load data from a valid IndexedDB cache', async () => {
    const mockCachedPools = MOCK_POOLS_RAW.slice(0, 1);
    const mockCachedFilterOptions = { tokens: ['TKA'], tvlRanges: [] };
    const validCacheTimestamp = MOCK_INITIAL_TIME - (10 * 60 * 1000);
    const mockCacheData = {
      key: 'poolsData',
      value: { timestamp: validCacheTimestamp, data: mockCachedPools, filterOptions: mockCachedFilterOptions }
    };
    getData.mockResolvedValue(mockCacheData);

    const { result } = renderPoolsHook();

    expect(result.current.loading).toBe(true);
    expect(initializeDB).toHaveBeenCalledTimes(1);
    
    // Wait for loading to finish (which implies cache check happened)
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // NOW check if getData was called
    expect(getData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.POOLS, 'poolsData');
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.pools).toEqual(mockCachedPools);
    expect(result.current.filterOptions).toEqual(mockCachedFilterOptions);
    expect(result.current.error).toBeNull();
    expect(saveData).not.toHaveBeenCalled();
  });

  it('should fetch new data if IndexedDB cache is expired', async () => {
    const expiredTimestamp = MOCK_INITIAL_TIME - (2 * 60 * 60 * 1000);
    const mockCacheData = {
      key: 'poolsData',
      value: { timestamp: expiredTimestamp, data: [MOCK_POOLS_RAW[0]], filterOptions: { tokens: [], tvlRanges: [] } }
    };
    getData.mockResolvedValue(mockCacheData);
    
    fetch.mockImplementation(url => {
      if (url === '/api/tokens') return Promise.resolve({ ok: true, json: async () => MOCK_TOKENS_API_RESPONSE });
      if (url === '/api/pools') return Promise.resolve({ ok: true, json: async () => MOCK_POOLS_API_RESPONSE });
      return Promise.resolve({ ok: false, status: 404 });
    });

    const { result } = renderPoolsHook();

    expect(result.current.loading).toBe(true);
    
    // Wait for loading to finish
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // NOW check if getData was called
    expect(getData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.POOLS, 'poolsData');
    expect(fetch).toHaveBeenCalledWith('/api/tokens');
    expect(fetch).toHaveBeenCalledWith('/api/pools');
    expect(result.current.pools.length).toBe(MOCK_POOLS_RAW.length);
    expect(result.current.pools[0].address).toBe(MOCK_POOLS_RAW[0].address);
    expect(result.current.error).toBeNull();
    expect(saveData).toHaveBeenCalledTimes(1);
  });

  it('should fetch new data if IndexedDB getData fails', async () => {
    const dbError = new Error('IndexedDB read failed');
    getData.mockRejectedValue(dbError);

    fetch.mockImplementation(url => {
      if (url === '/api/tokens') return Promise.resolve({ ok: true, json: async () => MOCK_TOKENS_API_RESPONSE });
      if (url === '/api/pools') return Promise.resolve({ ok: true, json: async () => MOCK_POOLS_API_RESPONSE });
      return Promise.resolve({ ok: false, status: 404 });
    });
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderPoolsHook();

    expect(result.current.loading).toBe(true);
    
    // Wait for loading to finish
    await waitFor(() => expect(result.current.loading).toBe(false));

    // NOW check if getData was called
    expect(getData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.POOLS, 'poolsData');
    expect(fetch).toHaveBeenCalledWith('/api/tokens');
    expect(fetch).toHaveBeenCalledWith('/api/pools');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[usePoolsData] Error reading cache:', dbError);
    expect(result.current.pools.length).toBe(MOCK_POOLS_RAW.length);
    expect(result.current.error).toBeNull();
    expect(saveData).toHaveBeenCalledTimes(1);
    
    consoleErrorSpy.mockRestore();
  });

  it('should still set pools data even if IndexedDB saveData fails', async () => {
     // Mock saveData to reject
    const dbSaveError = new Error('IndexedDB save failed');
    saveData.mockRejectedValue(dbSaveError);
    
     // Setup default API mocks (as they WILL be called)
    fetch.mockImplementation(url => {
      if (url === '/api/tokens') return Promise.resolve({ ok: true, json: async () => MOCK_TOKENS_API_RESPONSE });
      if (url === '/api/pools') return Promise.resolve({ ok: true, json: async () => MOCK_POOLS_API_RESPONSE });
      return Promise.resolve({ ok: false, status: 404 });
    });
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderPoolsHook();

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetch).toHaveBeenCalledWith('/api/tokens');
    expect(fetch).toHaveBeenCalledWith('/api/pools');
    expect(saveData).toHaveBeenCalled(); // Attempted to save
    expect(consoleErrorSpy).toHaveBeenCalledWith('[usePoolsData] Error saving to cache:', dbSaveError);

    // Crucially, pools data should still be populated from API fetch
    expect(result.current.pools.length).toBe(MOCK_POOLS_RAW.length);
    expect(result.current.error).toBeNull(); // Save error doesn't set state error

    consoleErrorSpy.mockRestore();
  });

  it('should force refresh data when refresh() is called', async () => {
    // Setup cache to be initially valid
    const validCacheTimestamp = MOCK_INITIAL_TIME - (10 * 60 * 1000); 
    const mockCacheData = {
      key: 'poolsData',
      value: {
        timestamp: validCacheTimestamp,
        data: [MOCK_POOLS_RAW[0]], 
        filterOptions: { tokens: [], tvlRanges: [] },
      }
    };
    getData.mockResolvedValue(mockCacheData);
    
    // Setup API mocks for the *second* call (refresh)
    fetch.mockImplementation(url => {
      if (url === '/api/tokens') return Promise.resolve({ ok: true, json: async () => MOCK_TOKENS_API_RESPONSE });
      if (url === '/api/pools') return Promise.resolve({ ok: true, json: async () => ({ data: MOCK_POOLS_RAW.slice(1) }) }); // Return different data on refresh
      return Promise.resolve({ ok: false, status: 404 });
    });

    const { result } = renderPoolsHook();

    // Initial load from cache
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.pools.length).toBe(1); // Loaded from cache

    // Clear mocks before refresh call
    fetch.mockClear();
    saveData.mockClear();
    getData.mockClear(); // Ensure getData isn't called again on force refresh

    // Call refresh
    await act(async () => {
       await result.current.refresh();
    });

    // Check cache was bypassed and API was called
    expect(getData).not.toHaveBeenCalled(); // Should not check cache on force refresh
    expect(fetch).toHaveBeenCalledWith('/api/tokens');
    expect(fetch).toHaveBeenCalledWith('/api/pools');
    expect(saveData).toHaveBeenCalledTimes(1); // Should save the refreshed data
    
    // Check data is the new data from the refresh API call
    expect(result.current.pools.length).toBe(MOCK_POOLS_RAW.length - 1);
    expect(result.current.pools[0].address).toBe(MOCK_POOLS_RAW[1].address);
    expect(result.current.error).toBeNull();
  });
  
  // --- Filtering and Sorting Tests ---
  describe('Filtering and Sorting', () => {
    // Helper to get rendered pools after filters are applied
    const getFilteredPools = async (initialFilters = {}) => {
      const { result } = renderPoolsHook();
      // Wait for initial load
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      // Apply filters if provided
      if (Object.keys(initialFilters).length > 0) {
          act(() => {
              result.current.applyFilters(initialFilters);
          });
          // Wait for state update (optional, but good practice if needed)
          await waitFor(() => expect(result.current.filters).toMatchObject(initialFilters));
      }
      
      return result.current.pools; 
    };

    it('should filter pools by token symbol (case-insensitive)', async () => {
      const poolsTKA = await getFilteredPools({ token: 'tka' }); // Lowercase
      expect(poolsTKA.length).toBe(2); // pool1 (TKA/TKB), pool2 (TKA/TKC)
      expect(poolsTKA.every(p => p.tokenA.symbol === 'TKA' || p.tokenB.symbol === 'TKA')).toBe(true);

      const poolsTKB = await getFilteredPools({ token: 'TKB' }); // Uppercase
      expect(poolsTKB.length).toBe(2); // pool1 (TKA/TKB), pool3 (TKB/TKC)
      expect(poolsTKB.every(p => p.tokenA.symbol === 'TKB' || p.tokenB.symbol === 'TKB')).toBe(true);

      const poolsNone = await getFilteredPools({ token: 'NonExistent' });
      expect(poolsNone.length).toBe(0);
    });

    it('should filter pools by minimum TVL', async () => {
      // MOCK_POOLS_RAW TVLs: 150000, 50000, 5000
      const poolsOver100k = await getFilteredPools({ minTvl: 100000 });
      expect(poolsOver100k.length).toBe(1);
      expect(poolsOver100k[0].address).toBe('pool1');

      const poolsOver40k = await getFilteredPools({ minTvl: 40000 });
      expect(poolsOver40k.length).toBe(2); // pool1, pool2
      expect(poolsOver40k.map(p => p.address)).toEqual(expect.arrayContaining(['pool1', 'pool2']));

      const poolsAny = await getFilteredPools({ minTvl: 0 });
      expect(poolsAny.length).toBe(MOCK_POOLS_RAW.length); // Should return all
    });
    
    it('should apply multiple filters together (token and TVL)', async () => {
      // TKA pools: pool1 (150k), pool2 (50k)
      const pools = await getFilteredPools({ token: 'TKA', minTvl: 60000 });
      expect(pools.length).toBe(1);
      expect(pools[0].address).toBe('pool1');
    });

    it('should sort pools by TVL (default: desc)', async () => {
      // Default sort is TVL desc
      const pools = await getFilteredPools(); 
      expect(pools.map(p => p.address)).toEqual(['pool1', 'pool2', 'pool3']); // 150k, 50k, 5k
      
      const poolsAsc = await getFilteredPools({ sortBy: 'tvl', sortOrder: 'asc' });
      expect(poolsAsc.map(p => p.address)).toEqual(['pool3', 'pool2', 'pool1']);
    });
    
    it('should sort pools by Fee Rate', async () => {
      // Fees: pool1 (0.003), pool2 (0.01), pool3 (0.005)
      const poolsDesc = await getFilteredPools({ sortBy: 'fee', sortOrder: 'desc' }); 
      expect(poolsDesc.map(p => p.address)).toEqual(['pool2', 'pool3', 'pool1']); // 0.01, 0.005, 0.003
      
      const poolsAsc = await getFilteredPools({ sortBy: 'fee', sortOrder: 'asc' });
      expect(poolsAsc.map(p => p.address)).toEqual(['pool1', 'pool3', 'pool2']);
    });
    
    it('should sort pools by Volume (24h)', async () => {
       // Volume 24h: pool1 (10000), pool2 (5000), pool3 (100)
      const poolsDesc = await getFilteredPools({ sortBy: 'volume24h', sortOrder: 'desc' }); 
      expect(poolsDesc.map(p => p.address)).toEqual(['pool1', 'pool2', 'pool3']); 
      
      const poolsAsc = await getFilteredPools({ sortBy: 'volume24h', sortOrder: 'asc' });
      expect(poolsAsc.map(p => p.address)).toEqual(['pool3', 'pool2', 'pool1']);
    });
    
    it('should sort pools by Yield Over TVL (24h)', async () => {
       // Yield 24h: pool1 (0.0002), pool2 (0.001), pool3 (0.0001)
      const poolsDesc = await getFilteredPools({ sortBy: 'yield_over_tvl24h', sortOrder: 'desc' }); 
      expect(poolsDesc.map(p => p.address)).toEqual(['pool2', 'pool1', 'pool3']); 
      
      const poolsAsc = await getFilteredPools({ sortBy: 'yield_over_tvl24h', sortOrder: 'asc' });
      expect(poolsAsc.map(p => p.address)).toEqual(['pool3', 'pool1', 'pool2']);
    });

    it('should generate correct filter options', async () => {
        const { result } = renderPoolsHook();
        await waitFor(() => expect(result.current.loading).toBe(false));

        const options = result.current.filterOptions;
        // Tokens: TKA, TKB, TKC
        expect(options.tokens).toEqual(['TKA', 'TKB', 'TKC']); 
        // TVLs: 150000, 50000, 5000 => Max 150k
        // Check expected ranges are present (up to 100k+) and 1M+ is filtered out
        expect(options.tvlRanges.map(r => r.value)).toEqual(expect.arrayContaining([0, 10000, 50000, 100000]));
        expect(options.tvlRanges.map(r => r.value)).not.toEqual(expect.arrayContaining([1000000]));
    });
    
  });
  // --- End Filtering and Sorting Tests ---
  
}); // End describe('usePoolsData Hook')
