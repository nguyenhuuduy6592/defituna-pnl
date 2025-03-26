export const AutoRefresh = ({
  autoRefresh,
  setAutoRefresh,
  refreshInterval,
  onIntervalChange,
  autoRefreshCountdown,
  loading
}) => {
  return (
    <div className="refresh-controls">
      <div className="refresh-toggle">
        <label className="auto-refresh-label">
          <input 
            type="checkbox" 
            checked={autoRefresh} 
            onChange={e => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>
        
        {autoRefresh && (
          <div className="interval-selector">
            <select value={refreshInterval} onChange={onIntervalChange}>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
            </select>
          </div>
        )}
      </div>
      {autoRefresh && (
        <div className="refresh-status">
          {loading ? 
            <span className="loading-text">Refreshing data...</span> : 
            <span>Next refresh in {autoRefreshCountdown} seconds</span>
          }
        </div>
      )}
    </div>
  );
};