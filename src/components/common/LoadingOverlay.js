import styles from './LoadingOverlay.module.scss';

/**
 * A component that wraps its children and displays a loading overlay
 * with a blur effect when the 'loading' prop is true.
 *
 * @param {Object} props Component props
 * @param {boolean} props.loading Whether to show the loading state
 * @param {React.ReactNode} props.children Content to display under the loading overlay
 * @param {string} [props.message="Refreshing..."] Text to display during loading state
 */
export const LoadingOverlay = ({
  loading,
  children,
  message = 'Refreshing...',
}) => {
  const overlayClassName = `${styles.loadingOverlay} ${!loading ? styles.loadingOverlayHidden : ''}`;

  return (
    <div className={styles.loadingContainer}>
      {children} {/* Render children normally */}
      {/* Render overlay conditionally based on loading state */}
      <div
        className={overlayClassName}
        aria-hidden={!loading} // Accessibility
        aria-live="polite" // Announce changes for screen readers
      >
        {loading && <span>{message}</span>}
      </div>
    </div>
  );
};