import { CurrencySwitch } from './CurrencySwitch';
import { PositionsList } from './PositionsList';
import styles from './PnLDisplay.module.scss';

export const PnLDisplay = ({ data, isSol, setIsSol }) => {
  const formatValue = (val) => {
    // Convert USD to SOL or keep as USD
    const value = isSol ? val / data.solPrice : val;
    
    if (isSol) {
      // For SOL values, always show 6 decimal places
      return `${value >= 0 ? ' ' : '-'}${Math.abs(value).toFixed(6)}`.padStart(10);
    } else {
      // For USD values
      if (Math.abs(value) < 0.01 && value !== 0) {
        // Small USD values: show up to 6 decimal places
        return `${value >= 0 ? ' ' : '-'}${Math.abs(value).toFixed(6)}`.padStart(8);
      } else {
        // Normal USD values: show 2 decimal places
        return `${value >= 0 ? ' ' : '-'}${Math.abs(value).toFixed(2)}`.padStart(8);
      }
    }
  };

  return (
    <div className={styles.pnlContainer}>
      <CurrencySwitch isSol={isSol} setIsSol={setIsSol} />
      <div className={styles.pnlGrid}>
        <div className={styles.pnlItem}>
          <div className={styles.label}>Total PnL</div>
          <div className={`${styles.value} ${data.totalPnL > 0 ? styles.positive : data.totalPnL < 0 ? styles.negative : styles.zero}`}>
            {isSol ? `${formatValue(data.totalPnL)} SOL` : `$${formatValue(data.totalPnL)}`}
          </div>
        </div>
        <div className={styles.pnlItem}>
          <div className={styles.label}>Current SOL Price</div>
          <div className={styles.value}>${data.solPrice.toFixed(2)}</div>
        </div>
      </div>
      <PositionsList positions={data.positions} isSol={isSol} formatValue={formatValue} />
    </div>
  );
};