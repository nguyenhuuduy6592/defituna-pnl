import styles from './AutoRefresh.module.scss';

export const AutoRefresh = ({
  autoRefresh,
  setAutoRefresh,
  refreshInterval,
  onIntervalChange,
  autoRefreshCountdown,
  loading
}) => {
  return (
    <div className={styles.refreshControls}>
      <div className={styles.refreshToggle}>
        <label className={styles.autoRefreshLabel}>
          <input 
            type="checkbox" 
            checked={autoRefresh} 
            onChange={e => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>
        
        {autoRefresh && (
          <div className={styles.intervalSelector}>
            <select value={refreshInterval} onChange={onIntervalChange}>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
            </select>
          </div>
        )}
      </div>
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