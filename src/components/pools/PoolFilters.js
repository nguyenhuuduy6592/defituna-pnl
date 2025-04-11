import React, { useEffect, useState } from 'react';
import styles from '@/styles/PoolFilters.module.scss';
import TimeframeSelector from '@/components/common/TimeframeSelector';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';

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

// Helper function to get readable sort field names
const getSortFieldName = (field) => {
  // Remove timeframe suffix from field
  const baseField = field.replace(/24h|7d|30d/g, '');
  
  // Map to readable names
  const fieldNames = {
    'tvl': 'TVL',
    'volume': 'Volume',
    'yield_over_tvl': 'Yield',
    'fee': 'Fee Rate',
    'fee_apr': 'Fee APR'
  };
  
  return fieldNames[baseField] || baseField;
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
  // State for saved filters
  const [savedFilters, setSavedFilters] = useState([]);

  // Load saved filters and current filters from IndexedDB on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const db = await initializeDB();
        if (!db) return;

        // Load saved filters
        const savedFiltersData = await getData(db, STORE_NAMES.SETTINGS, 'poolSavedFilters');
        if (savedFiltersData?.value) {
          setSavedFilters(savedFiltersData.value);
        }
        
        // Load current filters
        const currentFiltersData = await getData(db, STORE_NAMES.SETTINGS, 'poolFilters');
        if (currentFiltersData?.value) {
          onFilterChange(currentFiltersData.value);
        }
      } catch (error) {
        console.error('Error loading pool filters from IndexedDB:', error);
      }
    };

    loadFilters();
  }, [onFilterChange]);

  // Save filters to IndexedDB when they change
  useEffect(() => {
    const saveFilters = async () => {
      try {
        const db = await initializeDB();
        if (!db) return;

        await saveData(db, STORE_NAMES.SETTINGS, {
          key: 'poolFilters',
          value: filters
        });
      } catch (error) {
        console.error('Error saving pool filters to IndexedDB:', error);
      }
    };

    saveFilters();
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
    const minTvl = Number(e.target.value);
    onFilterChange({
      ...filters,
      minTvl
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

  // Generate a descriptive label for the current filter
  const getFilterLabel = () => {
    const parts = [];
    
    // Add sorting info with readable field name and direction
    const sortFieldName = getSortFieldName(filters.sortBy);
    const sortDirection = filters.sortOrder === 'asc' ? 'Low to High' : 'High to Low';
    parts.push(`${sortFieldName} (${sortDirection})`);
    
    // Add timeframe
    parts.push(`Time: ${filters.timeframe}`);
    
    // Add token if selected
    if (filters.token) {
      parts.push(`Token: ${filters.token}`);
    }
    
    // Add TVL if not default
    if (filters.minTvl > 0) {
      const tvlOption = filterOptions.tvlRanges.find(r => r.value === filters.minTvl);
      parts.push(`Min TVL: ${tvlOption ? tvlOption.label : `$${filters.minTvl}`}`);
    }
    
    return parts.join(' | ');
  };

  // Save current filter
  const handleSaveFilter = async () => {
    const label = getFilterLabel();
    
    // Check if this filter is already saved
    const isDuplicate = savedFilters.some(f => 
      f.filters.sortBy === filters.sortBy &&
      f.filters.sortOrder === filters.sortOrder &&
      f.filters.token === filters.token &&
      f.filters.minTvl === filters.minTvl &&
      f.filters.timeframe === filters.timeframe
    );
    
    if (isDuplicate) return;
    
    const newSavedFilter = {
      id: Date.now(),
      label,
      filters: { ...filters }
    };
    
    const updatedSavedFilters = [...savedFilters, newSavedFilter];
    setSavedFilters(updatedSavedFilters);

    try {
      const db = await initializeDB();
      if (!db) return;

      await saveData(db, STORE_NAMES.SETTINGS, {
        key: 'poolSavedFilters',
        value: updatedSavedFilters
      });
    } catch (error) {
      console.error('Error saving pool filters to IndexedDB:', error);
    }
  };

  // Apply a saved filter
  const handleApplySavedFilter = (savedFilter) => {
    onFilterChange(savedFilter.filters);
  };

  // Delete a saved filter
  const handleDeleteSavedFilter = async (id, e) => {
    e.stopPropagation();
    
    const updatedSavedFilters = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updatedSavedFilters);

    try {
      const db = await initializeDB();
      if (!db) return;

      await saveData(db, STORE_NAMES.SETTINGS, {
        key: 'poolSavedFilters',
        value: updatedSavedFilters
      });
    } catch (error) {
      console.error('Error saving pool filters to IndexedDB:', error);
    }
  };

  return (
    <div className={styles.filterContainer}>
      {/* Saved filters row - only show if there are saved filters */}
      {savedFilters.length > 0 && (
        <div className={styles.savedFiltersRow}>
          <div className={styles.savedFiltersLabel}>Saved Filters:</div>
          <div className={styles.savedFilters}>
            {savedFilters.map(filter => (
              <div
                key={filter.id}
                className={styles.savedFilter}
                onClick={() => handleApplySavedFilter(filter)}
                title="Click to apply this filter"
              >
                <span className={styles.savedFilterLabel}>{filter.label}</span>
                <button
                  className={styles.deleteFilterButton}
                  onClick={(e) => handleDeleteSavedFilter(filter.id, e)}
                  title="Delete this saved filter"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.filtersForm}>
        <div className={styles.filterControls}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Timeframe</label>
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

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>&nbsp;</label>
            <div className={styles.buttonGroup}>
              <button onClick={handleSaveFilter} className={styles.saveButton} title="Save current filter">
                Save
              </button>
              <button onClick={handleReset} className={styles.resetButton}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}