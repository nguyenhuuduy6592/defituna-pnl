import { useRef, useEffect, useCallback } from 'react';
import { HiX } from 'react-icons/hi';
import styles from './ConfirmationModal.module.scss';

/**
 * A modal dialog for confirming important actions.
 * Handles focus trapping and closing via Escape key, overlay click, or close button.
 */
export function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
  const closeButtonRef = useRef(null);

  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay}
      role="dialog"
      aria-labelledby="confirmation-title"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="confirmation-title">{title}</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Close"
            title="Close confirmation"
          >
            <HiX />
          </button>
        </div>

        <div className={styles.content}>
          <p>{message}</p>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={onClose} 
            className={styles.cancelButton}
            aria-label="Cancel action"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={styles.confirmButton}
            aria-label="Confirm action"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}