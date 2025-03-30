import { useCallback } from 'react';
import styles from './AutoRefresh.module.scss';
import { HistoryToggle } from '../history/HistoryToggle';

/**
 * Displays the refresh status text based on loading state and countdown
 */
const RefreshStatus = ({ loading, countdown }) => (
  <div className={styles.refreshStatus}>
    {loading ? 
      <span>Refreshing data...</span> : 
      <span>Next refresh in {countdown} seconds</span>
    }
  </div>
);

/**
 * Interval selector dropdown component
 */
const IntervalSelector = ({ value, onChange }) => (
  <div className={styles.intervalSelector}>
    <select 
      value={value} 
      onChange={onChange}
      aria-label="Select refresh interval"
      title="Select how often to refresh the data"
    >
      {process.env.NODE_ENV === 'development' && (
        <option value="5">5 seconds</option>
      )}
      <option value="30">30 seconds</option>
      <option value="60">1 minute</option>
      <option value="300">5 minutes</option>
    </select>
  </div>
);

/**
 * Component for controlling auto-refresh settings and historical data storage
 * 
 * @param {Object} props Component props
 * @param {boolean} props.autoRefresh Whether auto-refresh is enabled
 * @param {Function} props.setAutoRefresh Function to enable/disable auto-refresh
 * @param {number} props.refreshInterval Current refresh interval in seconds
 * @param {Function} props.onIntervalChange Handler for interval change
 * @param {number} props.autoRefreshCountdown Seconds until next refresh
 * @param {boolean} props.loading Whether data is currently refreshing
 * @param {boolean} props.historyEnabled Whether historical data storage is enabled
 * @param {Function} props.onHistoryToggle Handler for history toggle changes
 */
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
  const handleAutoRefreshToggle = useCallback((e) => {
    setAutoRefresh(e.target.checked);
  }, [setAutoRefresh]);

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
            onChange={handleAutoRefreshToggle}
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
        <>
          <IntervalSelector 
            value={refreshInterval} 
            onChange={onIntervalChange}
          />
          
          <RefreshStatus 
            loading={loading} 
            countdown={autoRefreshCountdown} 
          />
        </>
      )}
    </div>
  );
};