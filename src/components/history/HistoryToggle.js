import { useState } from 'react';
import styles from './HistoryToggle.module.scss';
import { HistoryConfirmationModal } from './HistoryConfirmationModal';

export const HistoryToggle = ({ enabled, onToggle, setAutoRefresh }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleToggle = (e) => {
    const newEnabled = e.target.checked;
    if (newEnabled) {
      setShowConfirmation(true);
    } else {
      onToggle(false);
    }
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    setAutoRefresh(true); // Enable auto-refresh when enabling history
    onToggle(true);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <label className={styles.toggle}>
        <input 
          type="checkbox" 
          checked={enabled}
          onChange={handleToggle}
        />
        <span>Store History</span>
      </label>

      {showConfirmation && (
        <HistoryConfirmationModal
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};