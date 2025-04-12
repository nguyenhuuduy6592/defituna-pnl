import { useCallback } from 'react';
import styles from '@/styles/AutoRefresh.module.scss';
import { HistoryToggle } from '@/components/history/HistoryToggle';
import { postMessageToSW } from '@/utils/serviceWorkerUtils';
import { REFRESH_INTERVALS } from '@/utils/constants';

/**
 * Displays the refresh status text based on loading state and countdown
 */
const RefreshStatus = ({ loading, countdown, isRefreshing }) => (
  <div className={styles.refreshStatus}>
    {loading || isRefreshing ? 
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
        <option value={REFRESH_INTERVALS.TEN_SECONDS}>10 seconds</option>
      )}
      <option value={REFRESH_INTERVALS.THIRTY_SECONDS}>30 seconds</option>
      <option value={REFRESH_INTERVALS.ONE_MINUTE}>1 minute</option>
      <option value={REFRESH_INTERVALS.FIVE_MINUTES}>5 minutes</option>
    </select>
  </div>
);

/**
 * Component for controlling auto-refresh settings and historical data storage
 * Uses the service worker as the single source of truth for data refreshing.
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
 * @param {boolean} props.isRefreshing Whether a refresh is currently in progress (visual only)
 */
export const AutoRefresh = ({
  autoRefresh,
  setAutoRefresh,
  refreshInterval,
  onIntervalChange,
  autoRefreshCountdown,
  loading,
  historyEnabled,
  onHistoryToggle,
  isRefreshing = false
}) => {
  // Update to handle toggling through service worker
  const handleAutoRefreshToggle = useCallback((e) => {
    const isChecked = e.target.checked;
    
    // Send message to service worker to start/stop sync
    postMessageToSW({ 
      type: isChecked ? 'START_SYNC' : 'STOP_SYNC',
      interval: refreshInterval
    });
    
    // Still update UI state
    setAutoRefresh(isChecked);
  }, [setAutoRefresh, refreshInterval]);

  // Update interval change to also notify service worker
  const handleIntervalChange = useCallback((e) => {
    const newInterval = parseInt(e.target.value, 10);
    
    // Send new interval to service worker
    postMessageToSW({ 
      type: 'SET_INTERVAL', 
      interval: newInterval 
    });
    
    // Still update UI
    if (onIntervalChange) {
      onIntervalChange(e);
    }
  }, [onIntervalChange]);

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
            onChange={handleIntervalChange}
          />
          
          <RefreshStatus 
            loading={loading} 
            countdown={autoRefreshCountdown}
            isRefreshing={isRefreshing}
          />
        </>
      )}
    </div>
  );
};