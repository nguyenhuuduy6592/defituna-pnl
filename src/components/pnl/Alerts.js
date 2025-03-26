import { useState } from 'react';

export const Alerts = ({ alerts, settings, updateSettings, clearAlerts }) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingChange = (key, value) => {
    updateSettings({ [key]: key === 'enabled' ? value : Number(value) });
  };

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h3>Position Alerts</h3>
        <div className="alerts-controls">
          <label>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleSettingChange('enabled', e.target.checked)}
            />
            Enable Alerts
          </label>
          <button 
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Settings
          </button>
          {alerts.length > 0 && (
            <button 
              className="clear-button"
              onClick={clearAlerts}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="alerts-settings">
          <div className="setting-item">
            <label>Yield Change Threshold (%)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={settings.apyThreshold}
              onChange={(e) => handleSettingChange('apyThreshold', e.target.value)}
            />
          </div>
          <div className="setting-item">
            <label>PnL Change Threshold (%)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={settings.priceThreshold}
              onChange={(e) => handleSettingChange('priceThreshold', e.target.value)}
            />
          </div>
          <div className="setting-item">
            <label>Utilization Change Threshold (%)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={settings.utilizationThreshold}
              onChange={(e) => handleSettingChange('utilizationThreshold', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <p className="no-alerts">No alerts to display</p>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`alert-item alert-${alert.type}`}
            >
              <div className="alert-content">
                <span className="alert-message">{alert.message}</span>
                <span className="alert-time">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};