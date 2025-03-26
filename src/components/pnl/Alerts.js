import { useState } from 'react';
import styles from './Alerts.module.scss';

export const Alerts = ({ alerts, settings, updateSettings, clearAlerts }) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingChange = (key, value) => {
    updateSettings({ [key]: key === 'enabled' ? value : Number(value) });
  };

  return (
    <div className={styles.alertsContainer}>
      <div className={styles.alertsHeader}>
        <h3>Position Alerts</h3>
        <div className={styles.alertsControls}>
          <label>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleSettingChange('enabled', e.target.checked)}
            />
            Enable Alerts
          </label>
          <button 
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Settings
          </button>
          {alerts.length > 0 && (
            <button 
              className={styles.clearButton}
              onClick={clearAlerts}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {showSettings && (
        <div className={styles.alertsSettings}>
          <div className={styles.settingItem}>
            <label>Yield Change Threshold (%)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={settings.apyThreshold}
              onChange={(e) => handleSettingChange('apyThreshold', e.target.value)}
            />
          </div>
          <div className={styles.settingItem}>
            <label>PnL Change Threshold (%)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={settings.priceThreshold}
              onChange={(e) => handleSettingChange('priceThreshold', e.target.value)}
            />
          </div>
          <div className={styles.settingItem}>
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

      <div className={styles.alertsList}>
        {alerts.length === 0 ? (
          <p className={styles.noAlerts}>No alerts to display</p>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`${styles.alertItem} ${styles[`alert${alert.type}`]}`}
            >
              <div className={styles.alertContent}>
                <span className={styles.alertMessage}>{alert.message}</span>
                <span className={styles.alertTime}>
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