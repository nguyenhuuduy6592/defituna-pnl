import React, { useMemo } from 'react';
import styles from './TotalPnLDisplay.module.scss';
import { formatValue, getValueClass } from '../../utils';

/**
 * Component for displaying total PnL information across multiple wallets
 * 
 * @param {Object} props Component props
 * @param {number} props.totalPnL Total PnL value
 * @param {number} props.walletCount Number of wallets
 * @returns {JSX.Element} Rendered component
 */
export const TotalPnLDisplay = ({ totalPnL = 0, walletCount = 0 }) => {
  // Ensure we have numeric values
  const safeTotalPnL = typeof totalPnL === 'number' ? totalPnL : 0;
  const safeWalletCount = typeof walletCount === 'number' ? walletCount : 0;
  
  // Memoize the formatted value and class to prevent unnecessary recalculations
  const { formattedValue, valueClass } = useMemo(() => ({
    formattedValue: formatValue(safeTotalPnL),
    valueClass: getValueClass(safeTotalPnL)
  }), [safeTotalPnL]);
  
  return (
    <div className={styles.pnlHeader}>
      <div className={styles.pnlGrid}>
        <div className={styles.pnlItem}>
          <div className={styles.label}>
            Total PnL ({safeWalletCount} Wallets)
          </div>
          <div 
            className={`${styles.value} ${styles[valueClass]}`}
            aria-label={`Total profit and loss: ${formattedValue} dollars`}
          >
            ${formattedValue}
          </div>
        </div>
      </div>
    </div>
  );
}; 