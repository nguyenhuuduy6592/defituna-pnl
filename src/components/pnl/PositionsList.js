import { memo } from 'react';
import styles from './PositionsList.module.scss';

export const PositionsList = memo(({ positions, formatValue }) => {
  const formatNumber = (num) => {
    if (Math.abs(num) < 0.01 && num !== 0) {
      // Small USD values: show up to 6 decimal places
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      });
    } else {
      // Normal USD values: show 2 decimal places
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  };

  const formatDuration = (ageString) => {
    if (!ageString || ageString === 'Unknown') return 'Unknown';
    
    // Age string is already formatted (e.g. "5d", "2h", "30m", "45s")
    return ageString;
  };

  const getStateClass = (state) => {
    switch (state) {
      case 'open': return styles.stateOpen;
      case 'closed': return styles.stateClosed;
      case 'liquidated': return styles.stateLiquidated;
      default: return '';
    }
  };

  if (!positions || positions.length === 0) {
    return <div className={styles.noPositions}>No positions found</div>;
  }

  return (
    <div className={styles.positionsContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Pair</th>
            <th>State</th>
            <th>Age</th>
            <th>Yield</th>
            <th>Compounded</th>
            <th>Debt Change</th>
            <th>PnL</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p, i) => (
            <tr key={`${p.pair}-${i}`}>
              <td>{p.pair}</td>
              <td className={getStateClass(p.state)}>{p.state}</td>
              <td className={styles.timestamp}>{formatDuration(p.age)}</td>
              <td className={p.yield > 0 ? styles.positive : p.yield < 0 ? styles.negative : styles.zero}>
                ${formatNumber(p.yield)}
              </td>
              <td className={p.compounded > 0 ? styles.positive : p.compounded < 0 ? styles.negative : styles.zero}>
                ${formatNumber(p.compounded)}
              </td>
              <td className={p.debt > 0 ? styles.positive : p.debt < 0 ? styles.negative : styles.zero}>
                ${formatNumber(p.debt)}
              </td>
              <td className={p.pnl > 0 ? styles.positive : p.pnl < 0 ? styles.negative : styles.zero}>
                ${formatNumber(p.pnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});