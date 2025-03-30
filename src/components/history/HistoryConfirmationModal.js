import { useRef, useEffect, useCallback } from 'react';
import { HiX } from 'react-icons/hi';
import styles from './HistoryConfirmationModal.module.scss';

/**
 * Information notice component for modal
 */
const NoticeSection = ({ title, children }) => (
  <div className={styles.notice}>
    <p><strong>{title}</strong></p>
    {children}
  </div>
);

/**
 * Content section for enabling historical data
 */
const EnableContent = () => (
  <>
    <p>
      This feature will store your position data locally in your browser to enable:
    </p>
    <ul>
      <li>Historical performance chart</li>
    </ul>
    
    <NoticeSection title="Important notes:">
      <ul>
        <li>Auto-refresh will be enabled to collect data regularly</li>
        <li>The browser tab must be open to collect data</li>
        <li>Data is stored only in your browser</li>
        <li>Limited to last 30 days of history</li>
        <li>Requires approximately 5MB of storage space</li>
        <li>Data will be lost if you clear browser data</li>
      </ul>
    </NoticeSection>
  </>
);

/**
 * Content section for disabling historical data
 */
const DisableContent = () => (
  <>
    <p>
      Disabling historical data storage will:
    </p>
    <ul>
      <li>Stop collecting new position data</li>
      <li>Remove access to historical performance charts</li>
      <li>Keep existing data until browser data is cleared</li>
    </ul>
    
    <NoticeSection title="Important notes:">
      <ul>
        <li>You can re-enable this feature at any time</li>
        <li>Existing data will be preserved</li>
        <li>Auto-refresh will remain enabled if it was previously enabled</li>
      </ul>
    </NoticeSection>
  </>
);

/**
 * Modal for confirming historical data storage settings changes
 * 
 * @param {Object} props Component props
 * @param {Function} props.onConfirm Callback for confirming the action
 * @param {Function} props.onCancel Callback for canceling the action
 * @param {boolean} props.isEnabling Whether enabling or disabling history
 */
export const HistoryConfirmationModal = ({ onConfirm, onCancel, isEnabling }) => {
  const closeButtonRef = useRef(null);

  // Handle Escape key press
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onCancel();
  }, [onCancel]);

  // Handle clicks outside the modal
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) onCancel();
  }, [onCancel]);

  useEffect(() => {
    closeButtonRef.current?.focus();
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const modalTitle = isEnabling ? 'Enable Historical Data Storage' : 'Disable Historical Data Storage';
  const confirmButtonText = isEnabling ? 'Enable Historical Data' : 'Disable Historical Data';

  return (
    <div 
      className={styles.overlay}
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="modal-title">{modalTitle}</h2>
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
          {isEnabling ? <EnableContent /> : <DisableContent />}
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
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};