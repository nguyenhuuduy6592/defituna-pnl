import React, { useMemo } from 'react';
import styles from './TotalPnLDisplay.module.scss';
import { formatValue, getValueClass } from '../../utils';
import { usePriceContext } from '../../contexts/PriceContext';
import { useDisplayCurrency } from '../../contexts/DisplayCurrencyContext';

/**
 * Component for displaying total PnL information across multiple wallets
 * 
 * @param {Object} props Component props
 * @param {number} props.totalPnL Total PnL value
 * @returns {JSX.Element} Rendered component
 */
export const TotalPnLDisplay = ({ label, totalValue }) => {
  const { solPrice } = usePriceContext();
  const { showInSol } = useDisplayCurrency();
  const safeTotalValue = typeof totalValue === 'number' ? totalValue : 0;
  
  const displayValue = useMemo(() => {
    if (showInSol) {
      if (safeTotalValue === 0) {
        return `${formatValue(0, 2, true).trim()} SOL`;
      }
      if (solPrice) {
        const valueInSol = safeTotalValue / solPrice;
        return `${formatValue(valueInSol, 2, true).trim()} SOL`;
      }
      return 'N/A SOL';
    } else {
      return `$${formatValue(safeTotalValue)}`;
    }
  }, [safeTotalValue, solPrice, showInSol]);

  // Memoize the class to prevent unnecessary recalculations
  const valueClass = useMemo(() => getValueClass(safeTotalValue), [safeTotalValue]);
  
  return (
    <div className={styles.pnlHeader}>
      <div className={styles.pnlGrid}>
        <div className={styles.pnlItem}>
          <div className={styles.label}>
            {label}
          </div>
          <div 
            className={`${styles.value} ${styles[valueClass]}`}
            aria-label={`${label}: ${displayValue}`}
          >
            {displayValue}
          </div>
        </div>
      </div>
    </div>
  );
}; 