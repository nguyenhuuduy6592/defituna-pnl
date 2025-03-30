import styles from './Tooltip.module.scss';

/**
 * Tooltip component that displays additional information on hover
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children The element that triggers the tooltip
 * @param {React.ReactNode} props.content The content to display in the tooltip
 */
export const Tooltip = ({ children, content }) => {
  return (
    <div className={styles.tooltipContainer}>
      {children}
      <div className={styles.tooltip} role="tooltip" aria-live="polite">
        {content}
      </div>
    </div>
  );
};