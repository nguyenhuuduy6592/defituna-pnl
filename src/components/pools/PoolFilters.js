import React, { useEffect } from 'react';
import styles from '../../styles/PoolFilters.module.scss';
import TimeframeSelector from '../common/TimeframeSelector';

const TIMEFRAMES = ['24h', '7d', '30d'];

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

/**
 * Pool Filters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter settings
 * @param {Function} props.onFilterChange - Callback for when filters are changed
 * @param {Object} props.filterOptions - Available filter options
 */
export default function PoolFilters({ 
  filters, 
  onFilterChange, 
  filterOptions = DEFAULT_FILTER_OPTIONS
}) {
  // Load saved filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('poolFilters');
    if (savedFilters) {
      onFilterChange(JSON.parse(savedFilters));
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('poolFilters', JSON.stringify(filters));
  }, [filters]);

  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split(':');
    onFilterChange({
      ...filters,
      sortBy: field,
      sortOrder: order
    });
  };

  const handleTokenChange = (e) => {
    onFilterChange({
      ...filters,
      token: e.target.value
    });
  };

  const handleTvlChange = (e) => {
    onFilterChange({
      ...filters,
      minTvl: Number(e.target.value)
    });
  };

  const handleTimeframeChange = (timeframe) => {
    // If sortBy contains a timeframe (like volume24h or yield_over_tvl7d),
    // we need to update it to the new timeframe
    let updatedSortBy = filters.sortBy;
    
    if (filters.sortBy.includes('24h') || filters.sortBy.includes('7d') || filters.sortBy.includes('30d')) {
      // Get the base metric without timeframe
      const baseMetric = filters.sortBy.replace(/24h|7d|30d/g, '');
      // Create new sortBy with the new timeframe
      updatedSortBy = `${baseMetric}${timeframe}`;
    }
    
    const newFilters = {
      ...filters,
      timeframe,
      sortBy: updatedSortBy
    };
    
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    onFilterChange({
      sortBy: 'tvl',
      sortOrder: 'desc',
      token: '',
      minTvl: 0,
      timeframe: '24h'
    });
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filtersForm}>
        <div className={styles.filterControls}>
          <div className={styles.timeframeSelector}>
            <TimeframeSelector
              timeframes={TIMEFRAMES}
              selected={filters.timeframe}
              onChange={handleTimeframeChange}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Sort By</label>
            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={handleSortChange}
              className={styles.filterSelect}
            >
              <option value="tvl:desc">TVL (High to Low)</option>
              <option value="tvl:asc">TVL (Low to High)</option>
              <option value={`volume${filters.timeframe}:desc`}>Volume (High to Low)</option>
              <option value={`volume${filters.timeframe}:asc`}>Volume (Low to High)</option>
              <option value={`yield_over_tvl${filters.timeframe}:desc`}>Yield (High to Low)</option>
              <option value={`yield_over_tvl${filters.timeframe}:asc`}>Yield (Low to High)</option>
              <option value="fee:desc">Fee Rate (High to Low)</option>
              <option value="fee:asc">Fee Rate (Low to High)</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Token</label>
            <select
              value={filters.token}
              onChange={handleTokenChange}
              className={styles.filterSelect}
            >
              <option value="">All Tokens</option>
              {filterOptions.tokens?.map(token => (
                <option key={token} value={token}>{token}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Min TVL</label>
            <select
              value={filters.minTvl}
              onChange={handleTvlChange}
              className={styles.filterSelect}
            >
              {filterOptions.tvlRanges?.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>

          <button onClick={handleReset} className={styles.resetButton}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
} 