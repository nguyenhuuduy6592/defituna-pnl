import { useRef, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import styles from './DisclaimerModal.module.scss';

export const DisclaimerModal = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay}
      role="dialog"
      aria-labelledby="disclaimer-title"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
          
          <div className={styles.section}>
            <h3>Development Status</h3>
            <ul>
              <li>This is a personal project with no clear roadmap or due dates</li>
              <li>Features are added based on personal interest and time availability</li>
              <li>Limited testing capabilities may result in some features not working properly on all devices</li>
            </ul>
          </div>
          
          <div className={styles.section}>
            <h3>Data & Privacy</h3>
            <ul>
              <li>I do not collect any user data</li>
              <li>All data is stored locally in your browser using localStorage or IndexedDB</li>
              <li>This site is hosted on Vercel, which may collect server usage metrics (outside of my control)</li>
              <li>No tracking or analytics scripts are included in this application</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Contact & Support</h3>
            <p>
              If you have feature requests or encounter issues, please reach out to me on Twitter: <a href="https://x.com/DuyNguyenM2E" target="_blank" rel="noopener noreferrer">@DuyNguyenM2E</a>
            </p>
          </div>
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