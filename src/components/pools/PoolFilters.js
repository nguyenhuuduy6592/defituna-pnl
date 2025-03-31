import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../styles/PoolFilters.module.scss';

/**
 * Pool Filters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter settings
 * @param {Function} props.onApplyFilters - Callback for when filters are applied
 * @param {Array} props.pools - All pools data for calculating TVL ranges
 * @param {string} props.activeTimeframe - Active timeframe for stats display
 * @param {Function} props.onTimeframeChange - Callback for timeframe change
 */
export default function PoolFilters({ 
  filters, 
  onApplyFilters,
  pools = [],
  activeTimeframe,
  onTimeframeChange
}) {
  // Local state for filter inputs (to avoid applying filters on every change)
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const [tvlOptions, setTvlOptions] = useState([]);
  
  // Extract unique tokens from pools data
  const tokenOptions = useMemo(() => {
    if (!pools || pools.length === 0) return [];
    
    const tokenSet = new Set();
    pools.forEach(pool => {
      if (pool.tokenA?.symbol) tokenSet.add(pool.tokenA.symbol);
      if (pool.tokenB?.symbol) tokenSet.add(pool.tokenB.symbol);
    });
    
    const tokens = Array.from(tokenSet).sort();
    return [
      { value: '', label: 'All Tokens' },
      ...tokens.map(token => ({ value: token, label: token }))
    ];
  }, [pools]);
  
  // Calculate TVL options based on actual pool data
  useEffect(() => {
    if (pools && pools.length > 0) {
      const tvlValues = pools.map(pool => pool.tvl_usdc).sort((a, b) => a - b);
      const min = Math.floor(tvlValues[0] / 1000) * 1000;
      const max = Math.ceil(tvlValues[tvlValues.length - 1] / 1000) * 1000;
      
      // Create sensible TVL range options
      const options = [
        { value: 0, label: 'Any TVL' },
        { value: 10000, label: '$10K+' },
        { value: 50000, label: '$50K+' },
        { value: 100000, label: '$100K+' },
        { value: 250000, label: '$250K+' },
        { value: 500000, label: '$500K+' },
        { value: 1000000, label: '$1M+' },
        { value: 5000000, label: '$5M+' }
      ];
      
      setTvlOptions(options);
    }
  }, [pools]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...localFilters, [name]: value };
    setLocalFilters(newFilters);
    
    // Auto-apply filters for dropdowns
    onApplyFilters(newFilters);
  };
  
  // Handle sort change
  const handleSortChange = (e) => {
    const value = e.target.value;
    const [sortBy, sortOrder] = value.split('-');
    const newFilters = { ...localFilters, sortBy, sortOrder };
    setLocalFilters(newFilters);
    onApplyFilters(newFilters);
  };
  
  // Apply filters when form is submitted
  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters(localFilters);
  };
  
  // Reset filters
  const handleReset = () => {
    const resetFilters = {
      sortBy: 'tvl',
      sortOrder: 'desc',
      token: '',
      minTvl: 0
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };
  
  return (
    <div className={styles.filterContainer}>
      <form onSubmit={handleSubmit} className={styles.filtersForm}>
        <div className={styles.filterControls}>
          <div className={styles.timeframeSelector}>
            <button 
              type="button"
              className={`${styles.timeframeButton} ${activeTimeframe === '24h' ? styles.active : ''}`}
              onClick={() => onTimeframeChange('24h')}
            >
              24h
            </button>
            <button 
              type="button"
              className={`${styles.timeframeButton} ${activeTimeframe === '7d' ? styles.active : ''}`}
              onClick={() => onTimeframeChange('7d')}
            >
              7d
            </button>
            <button 
              type="button"
              className={`${styles.timeframeButton} ${activeTimeframe === '30d' ? styles.active : ''}`}
              onClick={() => onTimeframeChange('30d')}
            >
              30d
            </button>
          </div>
          
          <div className={styles.filterGroup}>
            <select 
              className={styles.filterSelect}
              value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
              onChange={handleSortChange}
              aria-label="Sort by"
            >
              <option value="tvl-desc">TVL ↓</option>
              <option value="tvl-asc">TVL ↑</option>
              <option value={`volume${activeTimeframe}-desc`}>Volume ↓</option>
              <option value={`volume${activeTimeframe}-asc`}>Volume ↑</option>
              <option value={`yield${activeTimeframe}-desc`}>Yield ↓</option>
              <option value={`yield${activeTimeframe}-asc`}>Yield ↑</option>
              <option value="fee-desc">Fee ↓</option>
              <option value="fee-asc">Fee ↑</option>
            </select>
            
            <select 
              className={styles.filterSelect}
              name="minTvl"
              value={localFilters.minTvl}
              onChange={handleInputChange}
              aria-label="Minimum TVL"
            >
              {tvlOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <select
              className={styles.filterSelect}
              name="token"
              value={localFilters.token}
              onChange={handleInputChange}
              aria-label="Filter by token"
            >
              {tokenOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <button 
              type="button" 
              className={styles.resetButton}
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 