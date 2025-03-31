import React, { useState } from 'react';
import styles from '../../styles/PoolFilters.module.scss';

/**
 * Pool Filters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter settings
 * @param {Function} props.onApplyFilters - Callback for when filters are applied
 * @param {Array} props.providers - Available providers for filtering
 * @param {string} props.activeTimeframe - Active timeframe for stats display
 * @param {Function} props.onTimeframeChange - Callback for timeframe change
 */
export default function PoolFilters({ 
  filters, 
  onApplyFilters, 
  providers = ['orca'], 
  activeTimeframe,
  onTimeframeChange
}) {
  // Local state for filter inputs (to avoid applying filters on every change)
  const [localFilters, setLocalFilters] = useState({ ...filters });
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle sort change
  const handleSortChange = (e) => {
    const value = e.target.value;
    const [sortBy, sortOrder] = value.split('-');
    setLocalFilters(prev => ({ ...prev, sortBy, sortOrder }));
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
      provider: '',
      minTvl: 0
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };
  
  return (
    <div className={styles.filterContainer}>
      <form onSubmit={handleSubmit} className={styles.filtersForm}>
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
        
        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Sort By</label>
            <select 
              className={styles.filterSelect}
              value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
              onChange={handleSortChange}
            >
              <option value="tvl-desc">TVL (High to Low)</option>
              <option value="tvl-asc">TVL (Low to High)</option>
              <option value={`volume${activeTimeframe}-desc`}>Volume (High to Low)</option>
              <option value={`volume${activeTimeframe}-asc`}>Volume (Low to High)</option>
              <option value={`yield${activeTimeframe}-desc`}>Yield (High to Low)</option>
              <option value={`yield${activeTimeframe}-asc`}>Yield (Low to High)</option>
              <option value="fee-desc">Fee (High to Low)</option>
              <option value="fee-asc">Fee (Low to High)</option>
            </select>
          </div>
          
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Provider</label>
            <select 
              className={styles.filterSelect}
              name="provider"
              value={localFilters.provider}
              onChange={handleInputChange}
            >
              <option value="">All Providers</option>
              {providers.map(provider => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Token Search</label>
            <input 
              type="text"
              className={styles.filterInput}
              name="token"
              value={localFilters.token}
              onChange={handleInputChange}
              placeholder="Token name or address"
            />
          </div>
          
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Min TVL ($)</label>
            <input 
              type="number"
              className={styles.filterInput}
              name="minTvl"
              value={localFilters.minTvl}
              onChange={handleInputChange}
              min="0"
              step="1000"
            />
          </div>
        </div>
        
        <div className={styles.buttonRow}>
          <button type="submit" className={styles.applyButton}>
            Apply Filters
          </button>
          <button 
            type="button" 
            className={styles.resetButton}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
} 