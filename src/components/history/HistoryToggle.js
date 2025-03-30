import { useState, useCallback } from 'react';
import styles from './HistoryToggle.module.scss';
import { HistoryConfirmationModal } from './HistoryConfirmationModal';

/**
 * Toggle switch for enabling/disabling position history storage
 * Shows a confirmation modal before changing the setting
 *
 * @param {Object} props Component props
 * @param {boolean} props.enabled Current state of history storage
 * @param {function(boolean): void} props.onToggle Callback when user confirms toggle change
 * @param {function(boolean): void} props.setAutoRefresh Function to control auto-refresh state
 */
export const HistoryToggle = ({ enabled, onToggle, setAutoRefresh }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  const handleToggle = useCallback((e) => {
    const newEnabled = e.target.checked;
    setPendingAction(newEnabled);
    setShowConfirmation(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setShowConfirmation(false);
    
    if (pendingAction) {
      setAutoRefresh(true); // Enable auto-refresh when enabling history
    }
    
    onToggle(pendingAction);
    setPendingAction(null);
  }, [pendingAction, onToggle, setAutoRefresh]);

  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
    setPendingAction(null);
  }, []);

  return (
    <>
      <label 
        className={styles.toggle}
        title="Store position history for charting and tracking performance over time"
      >
        <input 
          type="checkbox" 
          checked={enabled}
          onChange={handleToggle}
          aria-label="Enable historical data storage"
        />
        <span>Store History</span>
      </label>

      {showConfirmation && (
        <HistoryConfirmationModal
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isEnabling={pendingAction}
        />
      )}
    </>
  );
};