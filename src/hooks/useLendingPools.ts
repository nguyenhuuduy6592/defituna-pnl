import { useState, useEffect, useCallback, useMemo } from 'react';
import { VaultData, TokenInfo, PriceData } from '@/utils/api/lending';

interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  icon?: string;
}

// Default filter options
const DEFAULT_FILTER_OPTIONS = {
  tokens: [] as TokenMetadata[],
  tvlRanges: [
    { value: 0, label: 'Any TVL' },
    { value: 10000, label: '$10K+' },
    { value: 50000, label: '$50K+' },
    { value: 100000, label: '$100K+' },
    { value: 250000, label: '$250K+' },
    { value: 500000, label: '$500K+' },
    { value: 1000000, label: '$1M+' },
    { value: 5000000, label: '$5M+' }
  ],
  supplyApyRanges: [
    { value: 0, label: 'Any APY' },
    { value: 1, label: '1%+' },
    { value: 5, label: '5%+' },
    { value: 10, label: '10%+' },
    { value: 20, label: '20%+' },
    { value: 50, label: '50%+' }
  ],
  borrowApyRanges: [
    { value: 0, label: 'Any APY' },
    { value: 1, label: '1%+' },
    { value: 5, label: '5%+' },
    { value: 10, label: '10%+' },
    { value: 20, label: '20%+' },
    { value: 50, label: '50%+' }
  ],
  utilizationRanges: [
    { value: 0, label: 'Any %' },
    { value: 20, label: '20%+' },
    { value: 40, label: '40%+' },
    { value: 60, label: '60%+' },
    { value: 80, label: '80%+' }
  ]
};

interface LendingFilters {
  sortBy: 'tvl' | 'supplyApy' | 'borrowApy' | 'utilization';
  sortOrder: 'asc' | 'desc';
  token: string;
  minTvl: number;
  minSupplyApy: number;
  minBorrowApy: number;
  minUtilization: number;
}

// Add export
export type { LendingFilters };

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
    minTvl: 0,
    minSupplyApy: 0,
    minBorrowApy: 0,
    minUtilization: 0
  });
  const [filterOptions, setFilterOptions] = useState(DEFAULT_FILTER_OPTIONS);

  // Fetch token metadata
  const fetchTokenMetadata = async (mint: string): Promise<TokenMetadata> => {
    try {
      const response = await fetch(`/api/lending/token-info/${mint}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token metadata');
      }
      const data = await response.json();
      return {
        mint,
        symbol: data.symbol || mint.slice(0, 6),
        name: data.name || '',
        icon: data.logo
      };
    } catch (err) {
      console.error(`Error fetching metadata for token ${mint}:`, err);
      return {
        mint,
        symbol: mint.slice(0, 6),
        name: ''
      };
    }
  };

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
      const tokenMints = new Set<string>();
      const tvlValues: number[] = [];
      const supplyApyValues: number[] = [];
      const borrowApyValues: number[] = [];
      const utilizationValues: number[] = [];

      data.forEach((vault: VaultData) => {
        tokenMints.add(vault.mint);
        tvlValues.push(vault.depositedFunds.usdValue);
        // Convert APY values from decimal to percentage
        supplyApyValues.push(vault.supplyApy * 100);
        borrowApyValues.push(vault.borrowApy * 100);
        utilizationValues.push(vault.utilization * 100);
      });

      // Fetch token metadata for all unique tokens
      const tokenMetadataPromises = Array.from(tokenMints).map(fetchTokenMetadata);
      const tokenMetadata = await Promise.all(tokenMetadataPromises);

      // Sort tokens by symbol
      tokenMetadata.sort((a, b) => a.symbol.localeCompare(b.symbol));

      // Create TVL ranges
      const sortedTvl = tvlValues.sort((a, b) => a - b);
      const maxTvl = Math.ceil(sortedTvl[sortedTvl.length - 1] / 1000) * 1000;

      const tvlRanges = DEFAULT_FILTER_OPTIONS.tvlRanges.filter(
        range => range.value <= maxTvl
      );

      // Create APY ranges based on actual values
      const maxSupplyApy = Math.ceil(Math.max(...supplyApyValues));
      const maxBorrowApy = Math.ceil(Math.max(...borrowApyValues));

      // Generate APY ranges with different scales for supply and borrow
      const generateSupplyApyRanges = () => {
        // Use fixed, sensible increments for Supply APY ranges
        const ranges = [
          { value: 0, label: 'Any APY' },
          { value: 0.5, label: '0.5%+' },
          { value: 1, label: '1%+' },
          { value: 2, label: '2%+' },
          { value: 3, label: '3%+' },
          { value: 5, label: '5%+' },
          { value: 7.5, label: '7.5%+' },
          { value: 10, label: '10%+' },
          { value: 15, label: '15%+' },
          { value: 20, label: '20%+' },
          { value: 25, label: '25%+' },
          { value: 30, label: '30%+' }
        ];
        
        // Only return ranges up to slightly above the max Supply APY
        return ranges.filter(range => range.value <= Math.ceil(maxSupplyApy / 5) * 5);
      };

      const generateBorrowApyRanges = () => {
        // Use higher increments for Borrow APY ranges
        const ranges = [
          { value: 0, label: 'Any APY' },
          { value: 5, label: '5%+' },
          { value: 10, label: '10%+' },
          { value: 15, label: '15%+' },
          { value: 20, label: '20%+' },
          { value: 25, label: '25%+' },
          { value: 30, label: '30%+' },
          { value: 40, label: '40%+' },
          { value: 50, label: '50%+' },
          { value: 75, label: '75%+' },
          { value: 100, label: '100%+' }
        ];
        
        // Only return ranges up to slightly above the max Borrow APY
        return ranges.filter(range => range.value <= Math.ceil(maxBorrowApy / 10) * 10);
      };

      const supplyApyRanges = generateSupplyApyRanges();
      const borrowApyRanges = generateBorrowApyRanges();

      setFilterOptions({
        tokens: tokenMetadata,
        tvlRanges,
        supplyApyRanges,
        borrowApyRanges,
        utilizationRanges: DEFAULT_FILTER_OPTIONS.utilizationRanges
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

    // Apply Supply APY filter (convert decimal APY to percentage)
    if (filters.minSupplyApy > 0) {
      result = result.filter(vault => 
        vault.supplyApy * 100 >= filters.minSupplyApy
      );
    }

    // Apply Borrow APY filter (convert decimal APY to percentage)
    if (filters.minBorrowApy > 0) {
      result = result.filter(vault => 
        vault.borrowApy * 100 >= filters.minBorrowApy
      );
    }

    // Apply Utilization filter (already in percentage)
    if (filters.minUtilization > 0) {
      result = result.filter(vault => 
        vault.utilization * 100 >= filters.minUtilization
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
      
      switch (filters.sortBy) {
        case 'tvl':
          return (a.depositedFunds.usdValue - b.depositedFunds.usdValue) * multiplier;
        case 'supplyApy':
          // Convert to percentage for consistent sorting
          return ((a.supplyApy * 100) - (b.supplyApy * 100)) * multiplier;
        case 'borrowApy':
          // Convert to percentage for consistent sorting
          return ((a.borrowApy * 100) - (b.borrowApy * 100)) * multiplier;
        case 'utilization':
          // Already handling percentage in utilization
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