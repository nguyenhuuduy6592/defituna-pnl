import { PositionsList } from './PositionsList';
import styles from './PnLDisplay.module.scss';

export const PnLDisplay = ({ data }) => {
  const formatValue = (val) => {
    if (Math.abs(val) < 0.01 && val !== 0) {
      // Small USD values: show up to 6 decimal places
      return `${val >= 0 ? ' ' : '-'}${Math.abs(val).toFixed(6)}`.padStart(8);
    } else {
      // Normal USD values: show 2 decimal places
      return `${val >= 0 ? ' ' : '-'}${Math.abs(val).toFixed(2)}`.padStart(8);
    }
  };

  return (
    <div className={styles.pnlContainer}>
      <div className={styles.pnlGrid}>
        <div className={styles.pnlItem}>
          <div className={styles.label}>Total PnL</div>
          <div className={`${styles.value} ${data.totalPnL > 0 ? styles.positive : data.totalPnL < 0 ? styles.negative : styles.zero}`}>
            ${formatValue(data.totalPnL)}
          </div>
        </div>
      </div>
      <PositionsList positions={data.positions} formatValue={formatValue} />
    </div>
  );
};