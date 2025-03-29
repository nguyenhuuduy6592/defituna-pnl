import { useRef, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import styles from './HistoryConfirmationModal.module.scss';

export const HistoryConfirmationModal = ({ onConfirm, onCancel, isEnabling }) => {
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
          <h2 id="modal-title">
            {isEnabling ? 'Enable Historical Data Storage' : 'Disable Historical Data Storage'}
          </h2>
          <button 
            className={styles.closeButton} 
            onClick={onCancel}
            ref={closeButtonRef}
            aria-label="Close"
            title="Close modal"
          >
            <HiX />
          </button>
        </div>

        <div className={styles.content}>
          {isEnabling ? (
            <>
              <p>
                This feature will store your position data locally in your browser to enable:
              </p>
              <ul>
                <li>Historical performance chart</li>
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
            </>
          ) : (
            <>
              <p>
                Disabling historical data storage will:
              </p>
              <ul>
                <li>Stop collecting new position data</li>
                <li>Remove access to historical performance charts</li>
                <li>Keep existing data until browser data is cleared</li>
              </ul>
              
              <div className={styles.notice}>
                <p><strong>Important notes:</strong></p>
                <ul>
                  <li>You can re-enable this feature at any time</li>
                  <li>Existing data will be preserved</li>
                  <li>Auto-refresh will remain enabled if it was previously enabled</li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <button 
            onClick={onCancel} 
            className={styles.cancelButton}
            aria-label={`Cancel ${isEnabling ? 'enabling' : 'disabling'} historical data`}
            title={`Cancel ${isEnabling ? 'enabling' : 'disabling'} historical data storage`}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={styles.confirmButton} 
            autoFocus
            aria-label={`${isEnabling ? 'Enable' : 'Disable'} historical data storage`}
            title={`${isEnabling ? 'Enable' : 'Disable'} historical data storage`}
          >
            {isEnabling ? 'Enable Historical Data' : 'Disable Historical Data'}
          </button>
        </div>
      </div>
    </div>
  );
};