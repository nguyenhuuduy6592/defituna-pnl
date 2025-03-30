import styles from './TotalPnLDisplay.module.scss';
import { formatValue } from '../../utils/formatters';
import { getValueClass } from '../../utils/positionUtils';

/**
 * Component for displaying total PnL information
 * @param {Object} props Component props
 * @param {number} props.totalPnL Total PnL value
 * @param {number} props.walletCount Number of wallets
 * @returns {JSX.Element} Rendered component
 */
export const TotalPnLDisplay = ({ totalPnL = 0, walletCount = 0 }) => {
  // Ensure we have numeric values
  const safeTotalPnL = typeof totalPnL === 'number' ? totalPnL : 0;
  const safeWalletCount = typeof walletCount === 'number' ? walletCount : 0;
  
  const valueClass = getValueClass(safeTotalPnL);
  
  return (
    <div className={styles.pnlHeader}>
      <div className={styles.pnlGrid}>
        <div className={styles.pnlItem}>
          <div className={styles.label}>
            Total PnL ({safeWalletCount} Wallets)
          </div>
          <div className={`${styles.value} ${styles[valueClass]}`}>
            ${formatValue(safeTotalPnL)}
          </div>
        </div>
      </div>
    </div>
  );
}; 