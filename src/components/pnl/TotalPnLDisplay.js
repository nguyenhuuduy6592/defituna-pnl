import React from 'react';
import styles from './TotalPnLDisplay.module.scss';

/**
 * Component for displaying total PnL information across multiple wallets
 *
 * @param {Object} props Component props
 * @param {number} props.totalPnL Total PnL value
 * @returns {JSX.Element} Rendered component
 */
export const TotalPnLDisplay = ({ label, totalValue }) => {
  return (
    <div className={styles.pnlHeader}>
      <div className={styles.pnlGrid}>
        <div className={styles.pnlItem}>
          <div className={styles.label}>{label}</div>
          <div dangerouslySetInnerHTML={{ __html: totalValue }} />
        </div>
      </div>
    </div>
  );
};
