import React, { useEffect, useState } from 'react';
import styles from './LendingPoolFilters.module.scss';
import { LendingFilters } from '@/hooks/useLendingPools';
import TokenSelect from './TokenSelect';

interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  icon?: string;
}

interface LendingPoolFiltersProps {
  filters: LendingFilters;
  onFilterChange: (newFilters: Partial<LendingFilters>) => void;
  filterOptions: {
    tokens: TokenMetadata[];
    tvlRanges: { value: number; label: string; }[];
    utilizationRanges: { value: number; label: string; }[];
    supplyApyRanges: { value: number; label: string; }[];
    borrowApyRanges: { value: number; label: string; }[];
  };
}

export default function LendingPoolFilters({ filters, onFilterChange, filterOptions }: LendingPoolFiltersProps) {
  // State for saved filters
  const [savedFilters, setSavedFilters] = useState<Array<{
    id: number;
    label: string;
    filters: LendingFilters;
  }>>([]);

  // Load saved filters from localStorage on mount
  useEffect(() => {
    const savedFiltersFromStorage = localStorage.getItem('lendingPoolSavedFilters');
    if (savedFiltersFromStorage) {
      setSavedFilters(JSON.parse(savedFiltersFromStorage));
    }
    
    // Load current filters
    const savedFilters = localStorage.getItem('lendingPoolFilters');
    if (savedFilters) {
      onFilterChange(JSON.parse(savedFilters));
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('lendingPoolFilters', JSON.stringify(filters));
  }, [filters]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split(':');
    onFilterChange({
      sortBy: field as LendingFilters['sortBy'],
      sortOrder: order as 'asc' | 'desc'
    });
  };

  const handleTokenChange = (value: string) => {
    onFilterChange({
      token: value
    });
  };

  const handleTvlChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      minTvl: Number(e.target.value)
    });
  };

  const handleUtilizationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      minUtilization: Number(e.target.value)
    });
  };

  const handleSupplyApyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      minSupplyApy: Number(e.target.value)
    });
  };

  const handleBorrowApyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      minBorrowApy: Number(e.target.value)
    });
  };

  const handleReset = () => {
    onFilterChange({
      sortBy: 'tvl',
      sortOrder: 'desc',
      token: '',
      minTvl: 0,
      minSupplyApy: 0,
      minBorrowApy: 0,
      minUtilization: 0
    });
  };

  // Generate a descriptive label for the current filter
  const getFilterLabel = () => {
    const parts = [];
    
    // Add sorting info
    const sortFieldNames = {
      'tvl': 'TVL',
      'supplyApy': 'Supply APY',
      'borrowApy': 'Borrow APY',
      'utilization': 'Utilization'
    };
    const sortFieldName = sortFieldNames[filters.sortBy] || filters.sortBy;
    const sortDirection = filters.sortOrder === 'asc' ? 'Low to High' : 'High to Low';
    parts.push(`${sortFieldName} (${sortDirection})`);
    
    // Add token if selected
    if (filters.token) {
      const token = filterOptions.tokens.find(t => t.mint === filters.token);
      parts.push(`Token: ${token?.symbol || filters.token}`);
    }
    
    // Add TVL if not default
    if (filters.minTvl > 0) {
      const tvlOption = filterOptions.tvlRanges.find(r => r.value === filters.minTvl);
      parts.push(`Min TVL: ${tvlOption ? tvlOption.label : `$${filters.minTvl}`}`);
    }

    // Add Supply APY if not default
    if (filters.minSupplyApy > 0) {
      const supplyApyOption = filterOptions.supplyApyRanges?.find(r => r.value === filters.minSupplyApy);
      parts.push(`Min Supply APY: ${supplyApyOption ? supplyApyOption.label : `${filters.minSupplyApy}%`}`);
    }

    // Add Borrow APY if not default
    if (filters.minBorrowApy > 0) {
      const borrowApyOption = filterOptions.borrowApyRanges?.find(r => r.value === filters.minBorrowApy);
      parts.push(`Min Borrow APY: ${borrowApyOption ? borrowApyOption.label : `${filters.minBorrowApy}%`}`);
    }

    // Add Utilization if not default
    if (filters.minUtilization > 0) {
      parts.push(`Min Utilization: ${filters.minUtilization}%`);
    }
    
    return parts.join(' | ');
  };

  // Save current filter
  const handleSaveFilter = () => {
    const label = getFilterLabel();
    
    // Check if this filter is already saved
    const isDuplicate = savedFilters.some(f => 
      f.filters.sortBy === filters.sortBy &&
      f.filters.sortOrder === filters.sortOrder &&
      f.filters.token === filters.token &&
      f.filters.minTvl === filters.minTvl &&
      f.filters.minSupplyApy === filters.minSupplyApy &&
      f.filters.minBorrowApy === filters.minBorrowApy &&
      f.filters.minUtilization === filters.minUtilization
    );
    
    if (isDuplicate) return;
    
    const newSavedFilter = {
      id: Date.now(),
      label,
      filters: { ...filters }
    };
    
    const updatedSavedFilters = [...savedFilters, newSavedFilter];
    setSavedFilters(updatedSavedFilters);
    localStorage.setItem('lendingPoolSavedFilters', JSON.stringify(updatedSavedFilters));
  };

  // Apply a saved filter
  const handleApplySavedFilter = (savedFilter: { filters: LendingFilters }) => {
    onFilterChange(savedFilter.filters);
  };

  // Delete a saved filter
  const handleDeleteSavedFilter = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedSavedFilters = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updatedSavedFilters);
    localStorage.setItem('lendingPoolSavedFilters', JSON.stringify(updatedSavedFilters));
  };

  return (
    <div className={styles.filterContainer}>
      {/* Saved filters row - only show if there are saved filters */}
      {savedFilters.length > 0 && (
        <div className={styles.savedFiltersRow}>
          <div className={styles.savedFiltersLabel}>Saved:</div>
          <div className={styles.savedFilters}>
            {savedFilters.map(filter => (
              <div
                key={filter.id}
                className={styles.savedFilter}
                onClick={() => handleApplySavedFilter(filter)}
                title={filter.label}
              >
                <span className={styles.savedFilterLabel}>{filter.label}</span>
                <button
                  className={styles.deleteFilterButton}
                  onClick={(e) => handleDeleteSavedFilter(filter.id, e)}
                  title="Delete filter"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort By</label>
          <select
            className={styles.filterSelect}
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onChange={handleSortChange}
          >
            <option value="tvl:desc">TVL (High to Low)</option>
            <option value="tvl:asc">TVL (Low to High)</option>
            <option value="supplyApy:desc">Supply APY (High to Low)</option>
            <option value="supplyApy:asc">Supply APY (Low to High)</option>
            <option value="borrowApy:desc">Borrow APY (High to Low)</option>
            <option value="borrowApy:asc">Borrow APY (Low to High)</option>
            <option value="utilization:desc">Utilization (High to Low)</option>
            <option value="utilization:asc">Utilization (Low to High)</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Token</label>
          <TokenSelect
            tokens={filterOptions.tokens}
            value={filters.token}
            onChange={handleTokenChange}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Min TVL</label>
          <select
            className={styles.filterSelect}
            value={filters.minTvl}
            onChange={handleTvlChange}
          >
            {filterOptions.tvlRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Min Supply APY</label>
          <select
            className={styles.filterSelect}
            value={filters.minSupplyApy}
            onChange={handleSupplyApyChange}
          >
            {filterOptions.supplyApyRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Min Borrow APY</label>
          <select
            className={styles.filterSelect}
            value={filters.minBorrowApy}
            onChange={handleBorrowApyChange}
          >
            {filterOptions.borrowApyRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Min Utilization</label>
          <select
            className={styles.filterSelect}
            value={filters.minUtilization}
            onChange={handleUtilizationChange}
          >
            {filterOptions.utilizationRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button className={styles.saveButton} onClick={handleSaveFilter} title="Save current filters as a preset">
          Save Filters
        </button>
        <button className={styles.resetButton} onClick={handleReset} title="Reset all filters to default">
          Clear All
        </button>
      </div>
    </div>
  );
} 