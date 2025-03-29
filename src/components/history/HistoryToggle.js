import { useState } from 'react';
import styles from './HistoryToggle.module.scss';
import { HistoryConfirmationModal } from './HistoryConfirmationModal';

export const HistoryToggle = ({ enabled, onToggle, setAutoRefresh }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  const handleToggle = (e) => {
    const newEnabled = e.target.checked;
    setPendingAction(newEnabled);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    if (pendingAction) {
      setAutoRefresh(true); // Enable auto-refresh when enabling history
    }
    onToggle(pendingAction);
    setPendingAction(null);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingAction(null);
  };

  return (
    <>
      <label className={styles.toggle}>
        <input 
          type="checkbox" 
          checked={enabled}
          onChange={handleToggle}
          aria-label="Enable historical data storage"
          title="Store position history for charting"
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