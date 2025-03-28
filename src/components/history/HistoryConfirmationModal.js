import { useRef, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import styles from './HistoryConfirmationModal.module.scss';

export const HistoryConfirmationModal = ({ onConfirm, onCancel }) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div 
      className={styles.overlay}
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="modal-title">Enable Historical Data Storage</h2>
          <button 
            className={styles.closeButton} 
            onClick={onCancel}
            ref={closeButtonRef}
            aria-label="Close"
          >
            <HiX />
          </button>
        </div>

        <div className={styles.content}>
          <p>
            This feature will store your position data locally in your browser to enable:
          </p>
          <ul>
            <li>Position status change tracking</li>
            <li>PnL target alerts</li>
            <li>Historical performance analysis</li>
          </ul>
          
          <div className={styles.notice}>
            <p><strong>Important notes:</strong></p>
            <ul>
              <li>Auto-refresh will be enabled to collect data regularly</li>
              <li>Data is stored only in your browser</li>
              <li>Limited to last 30 days of history</li>
              <li>Requires approximately 5MB of storage space</li>
              <li>Data will be lost if you clear browser data</li>
            </ul>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={onConfirm} className={styles.confirmButton} autoFocus>
            Enable Historical Data
          </button>
        </div>
      </div>
    </div>
  );
};