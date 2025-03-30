import { useRef, useEffect, useCallback } from 'react';
import { HiX } from 'react-icons/hi';
import styles from './DisclaimerModal.module.scss';

/**
 * Modal section component for displaying grouped content
 */
const DisclaimerSection = ({ title, children }) => (
  <div className={styles.section}>
    <h3>{title}</h3>
    {children}
  </div>
);

/**
 * A modal dialog displaying project disclaimer information.
 * Handles focus trapping and closing via Escape key, overlay click, or close button.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls whether the modal is visible.
 * @param {function(): void} props.onClose - Callback function invoked when the modal requests to be closed.
 */
export const DisclaimerModal = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef(null);

  // Handle Escape key press
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  // Handle overlay click 
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
      aria-labelledby="disclaimer-title"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="disclaimer-title">Project Disclaimer</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Close"
            title="Close disclaimer"
          >
            <HiX />
          </button>
        </div>

        <div className={styles.content}>
          <p>
            <strong>Defituna PnL Viewer</strong> is a hobby project developed in my free time.
          </p>
          
          <DisclaimerSection title="Development Status">
            <ul>
              <li>This is a personal project with no clear roadmap or due dates</li>
              <li>Features are added based on personal interest and time availability</li>
              <li>Limited testing capabilities may result in some features not working properly on all devices</li>
            </ul>
          </DisclaimerSection>
          
          <DisclaimerSection title="Data & Privacy">
            <ul>
              <li>I do not collect any user data</li>
              <li>All data is stored locally in your browser using localStorage or IndexedDB</li>
              <li>This site is hosted on Vercel, which may collect server usage metrics (outside of my control)</li>
              <li>No tracking or analytics scripts are included in this application</li>
            </ul>
          </DisclaimerSection>

          <DisclaimerSection title="Contact & Support">
            <p>
              If you have feature requests or encounter issues, please reach out to me on Twitter: <a href="https://x.com/DuyNguyenM2E" target="_blank" rel="noopener noreferrer">@DuyNguyenM2E</a>
            </p>
          </DisclaimerSection>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={onClose} 
            className={styles.confirmButton}
            aria-label="Close disclaimer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}; 