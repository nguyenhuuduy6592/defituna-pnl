import { CurrencySwitch } from './CurrencySwitch';
import { PositionsList } from './PositionsList';
import styles from './PnLDisplay.module.scss';

export const PnLDisplay = ({ data, isSol, setIsSol }) => {
  const formatValue = (val) => {
    const value = isSol ? val : val * data.solPrice;
    return `${value >= 0 ? ' ' : '-'}${Math.abs(value).toFixed(isSol ? 6 : 2)}`.padStart(isSol ? 10 : 8);
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