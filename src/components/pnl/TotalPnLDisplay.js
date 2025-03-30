import React, { useMemo } from 'react';
import styles from './TotalPnLDisplay.module.scss';
import { formatValue, getValueClass } from '../../utils';

/**
 * Component for displaying total PnL information across multiple wallets
 * 
 * @param {Object} props Component props
 * @param {number} props.totalPnL Total PnL value
 * @returns {JSX.Element} Rendered component
 */
export const TotalPnLDisplay = ({ label, totalValue }) => {
  // Ensure we have numeric values
  const safeTotalValue = typeof totalValue === 'number' ? totalValue : 0;
  
  // Memoize the formatted value and class to prevent unnecessary recalculations
  const { formattedValue, valueClass } = useMemo(() => ({
    formattedValue: formatValue(safeTotalValue),
    valueClass: getValueClass(safeTotalValue)
  }), [safeTotalValue]);
  
  return (
    <div className={styles.pnlHeader}>
      <div className={styles.pnlGrid}>
        <div className={styles.pnlItem}>
          <div className={styles.label}>
            {label}
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