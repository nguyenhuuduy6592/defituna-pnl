import { useState } from 'react';
import styles from './AutoRefresh.module.scss';
import { HistoryToggle } from '../history/HistoryToggle';

export const AutoRefresh = ({
  autoRefresh,
  setAutoRefresh,
  refreshInterval,
  onIntervalChange,
  autoRefreshCountdown,
  loading,
  historyEnabled,
  onHistoryToggle
}) => {
  return (
    <div className={styles.refreshControls}>
      <div className={styles.refreshToggles}>
        <label 
          className={styles.refreshToggle}
          title="Automatically update position data at regular intervals. Useful for tracking real-time changes."
        >
          <input 
            type="checkbox" 
            checked={autoRefresh} 
            onChange={e => setAutoRefresh(e.target.checked)}
            aria-label="Enable auto-refresh"
          />
          <span>Auto-refresh</span>
        </label>
        
        <HistoryToggle 
          enabled={historyEnabled}
          onToggle={onHistoryToggle}
          setAutoRefresh={setAutoRefresh}
        />
      </div>
      
      {autoRefresh && (
        <div className={styles.intervalSelector}>
          <select 
            value={refreshInterval} 
            onChange={onIntervalChange}
            aria-label="Select refresh interval"
            title="Select how often to refresh the data"
          >
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
            <option value="300">5 minutes</option>
          </select>
        </div>
      )}
      
      {autoRefresh && (
        <div className={styles.refreshStatus}>
          {loading ? 
            <span>Refreshing data...</span> : 
            <span>Next refresh in {autoRefreshCountdown} seconds</span>
          }
        </div>
      )}
    </div>
  );
};