import { useState, useEffect, useCallback, useMemo } from 'react';
import { VaultData, TokenInfo, PriceData } from '@/utils/api/lending';

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

interface LendingFilters {
  sortBy: 'tvl' | 'supplyApy' | 'borrowApy' | 'utilization';
  sortOrder: 'asc' | 'desc';
  token: string;
  minTvl: number;
}

interface LendingPoolsState {
  vaults: VaultData[];
  loading: boolean;
  error: string | null;
  filters: LendingFilters;
  filterOptions: typeof DEFAULT_FILTER_OPTIONS;
  applyFilters: (newFilters: Partial<LendingFilters>) => void;
  refresh: () => Promise<void>;
}

export function useLendingPools(): LendingPoolsState {
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LendingFilters>({
    sortBy: 'tvl',
    sortOrder: 'desc',
    token: '',
    minTvl: 0
  });
  const [filterOptions, setFilterOptions] = useState(DEFAULT_FILTER_OPTIONS);

  // Fetch vaults data
  const fetchVaults = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch vaults data
      const response = await fetch('/api/lending/vaults');
      if (!response.ok) {
        throw new Error('Failed to fetch vaults');
      }

      const data = await response.json();

      // Update vaults
      setVaults(data);

      // Update filter options from the total vault list
      const tokens = new Set<string>();
      const tvlValues: number[] = [];

      data.forEach((vault: VaultData) => {
        tokens.add(vault.mint);
        tvlValues.push(vault.depositedFunds.usdValue);
      });

      // Create TVL ranges
      const sortedTvl = tvlValues.sort((a, b) => a - b);
      const maxTvl = Math.ceil(sortedTvl[sortedTvl.length - 1] / 1000) * 1000;

      const tvlRanges = DEFAULT_FILTER_OPTIONS.tvlRanges.filter(
        range => range.value <= maxTvl
      );

      setFilterOptions({
        tokens: Array.from(tokens).sort(),
        tvlRanges
      });

    } catch (err) {
      console.error('Error fetching vaults:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vaults');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchVaults();
    
    // Refresh every 30 seconds as specified in the caching strategy
    const intervalId = setInterval(() => {
      fetchVaults();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchVaults]);

  // Apply filters and sorting
  const filteredAndSortedVaults = useMemo(() => {
    let result = [...vaults];

    // Apply token filter
    if (filters.token) {
      result = result.filter(vault => 
        vault.mint.toLowerCase() === filters.token.toLowerCase()
      );
    }

    // Apply TVL filter
    if (filters.minTvl > 0) {
      result = result.filter(vault => 
        vault.depositedFunds.usdValue >= filters.minTvl
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
      
      switch (filters.sortBy) {
        case 'tvl':
          return (a.depositedFunds.usdValue - b.depositedFunds.usdValue) * multiplier;
        case 'supplyApy':
          return (a.supplyApy - b.supplyApy) * multiplier;
        case 'borrowApy':
          return (a.borrowApy - b.borrowApy) * multiplier;
        case 'utilization':
          return (a.utilization - b.utilization) * multiplier;
        default:
          return 0;
      }
    });

    return result;
  }, [vaults, filters]);

  const applyFilters = useCallback((newFilters: Partial<LendingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refresh = useCallback(() => {
    return fetchVaults(true);
  }, [fetchVaults]);

  return {
    vaults: filteredAndSortedVaults,
    loading,
    error,
    filters,
    filterOptions,
    applyFilters,
    refresh
  };
} 