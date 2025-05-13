import { renderHook, act } from '@testing-library/react';
import { useLendingPools } from '../useLendingPools';

// Mock fetch globally
global.fetch = jest.fn();

// Mock data for API response (snake_case)
const mockApiVaults = [
  {
    address: 'address1',
    mint: 'token1',
    deposited_funds: { amount: '100000', usd: 100000 },
    borrowed_funds: { amount: '50000', usd: 50000 },
    supply_limit: { amount: '200000', usd: 200000 },
    supply_apy: 0.05, // 5%
    borrow_apy: 0.08, // 8%
    utilization: 0.6, // 60%
    borrowed_shares: '500',
    deposited_shares: '1000',
    pyth_oracle_feed_id: 'pyth_id_1',
    pyth_oracle_price_update: 'pyth_update_1',
  },
  {
    address: 'address2',
    mint: 'token2',
    deposited_funds: { amount: '500000', usd: 500000 },
    borrowed_funds: { amount: '100000', usd: 100000 },
    supply_limit: { amount: '1000000', usd: 1000000 },
    supply_apy: 0.03, // 3%
    borrow_apy: 0.06, // 6%
    utilization: 0.4, // 40%
    borrowed_shares: '1000',
    deposited_shares: '5000',
    pyth_oracle_feed_id: 'pyth_id_2',
    pyth_oracle_price_update: 'pyth_update_2',
  },
];

const mockTokenInfo = {
  symbol: 'TEST',
  name: 'Test Token',
  logo: 'test-logo.png',
};

describe('useLendingPools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful vault data fetch
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/lending/vaults') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockApiVaults }), // Return data wrapped in 'data' property
        });
      }
      if (url.includes('/api/lending/token-info/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTokenInfo),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('should fetch and initialize vaults data', async () => {
    const { result } = renderHook(() => useLendingPools());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.vaults).toEqual([]);

    // Wait for data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.vaults).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Network error'))
    );

    const { result } = renderHook(() => useLendingPools());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(result.current.vaults).toEqual([]);
  });

  it('should apply token filter correctly', async () => {
    const { result } = renderHook(() => useLendingPools());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.applyFilters({ token: 'token1' });
    });

    expect(result.current.vaults).toHaveLength(1);
    expect(result.current.vaults[0].mint).toBe('token1');
  });

  it('should apply TVL filter correctly', async () => {
    const { result } = renderHook(() => useLendingPools());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.applyFilters({ minTvl: 200000 });
    });

    expect(result.current.vaults).toHaveLength(1);
    expect(result.current.vaults[0].depositedFunds.usdValue).toBe(500000);
  });

  it('should apply APY filters correctly', async () => {
    const { result } = renderHook(() => useLendingPools());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.applyFilters({ minSupplyApy: 4 }); // 4%
    });

    expect(result.current.vaults).toHaveLength(1);
    expect(result.current.vaults[0].supplyApy).toBe(0.05);
  });

  it('should sort vaults correctly', async () => {
    const { result } = renderHook(() => useLendingPools());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Test sorting by TVL ascending
    act(() => {
      result.current.applyFilters({ sortBy: 'tvl', sortOrder: 'asc' });
    });

    expect(result.current.vaults[0].depositedFunds.usdValue).toBe(100000);
    expect(result.current.vaults[1].depositedFunds.usdValue).toBe(500000);

    // Test sorting by TVL descending
    act(() => {
      result.current.applyFilters({ sortBy: 'tvl', sortOrder: 'desc' });
    });

    expect(result.current.vaults[0].depositedFunds.usdValue).toBe(500000);
    expect(result.current.vaults[1].depositedFunds.usdValue).toBe(100000);
  });

  it('should refresh data when refresh function is called', async () => {
    const { result } = renderHook(() => useLendingPools());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Clear the previous fetch calls
    (global.fetch as jest.Mock).mockClear();

    // Call refresh
    await act(async () => {
      await result.current.refresh();
    });

    // Verify that fetch was called again
    expect(global.fetch).toHaveBeenCalledWith('/api/lending/vaults');
  });

  it('should update filter options based on vault data', async () => {
    const { result } = renderHook(() => useLendingPools());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.filterOptions.tokens).toBeDefined();
    expect(result.current.filterOptions.tvlRanges).toBeDefined();
    expect(result.current.filterOptions.supplyApyRanges).toBeDefined();
    expect(result.current.filterOptions.borrowApyRanges).toBeDefined();
    expect(result.current.filterOptions.utilizationRanges).toBeDefined();
  });
}); 