import React from 'react';
import styles from './LoadingOverlay.module.scss';

/**
 * A component that wraps its children and displays a loading overlay
 * with a blur effect when the 'loading' prop is true.
 */
export const LoadingOverlay = ({ loading, children, message = 'Refreshing...' }) => {
  return (
    <div className={styles.container}>
      {children} {/* Render children normally */}
      {/* Render overlay conditionally based on loading state */}
      <div 
        className={`${styles.overlay} ${!loading ? styles.overlayHidden : ''}`}
        aria-hidden={!loading} // Accessibility
        aria-live="polite" // Announce changes for screen readers
      >
        {loading && <span>{message}</span>}
      </div>
    </div>
  );
}; 