import styles from './Tooltip.module.scss';

export const Tooltip = ({ children, content }) => {
  return (
    <div className={styles.tooltipContainer}>
      {children}
      <div className={styles.tooltip} role="tooltip">
        {content}
      </div>
    </div>
  );
};