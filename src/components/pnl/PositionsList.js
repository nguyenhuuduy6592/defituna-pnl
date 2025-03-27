import { memo } from 'react';
import styles from './PositionsList.module.scss';

export const PositionsList = memo(({ positions, formatValue }) => {
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0.00';
    
    if (Math.abs(num) < 0.01 && num !== 0) {
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      });
    } else {
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  };

  const formatDuration = (ageString) => {
    if (!ageString || ageString === 'Unknown') return 'Unknown';
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

  const getValueClass = (value) => {
    if (value > 0) return styles.positive;
    if (value < 0) return styles.negative;
    return styles.zero;
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
              <td className={getValueClass(p.yield)}>
                ${formatNumber(p.yield)}
              </td>
              <td className={getValueClass(p.compounded)}>
                ${formatNumber(p.compounded)}
              </td>
              <td className={getValueClass(p.debt)}>
                ${formatNumber(p.debt)}
              </td>
              <td className={getValueClass(p.pnl)}>
                ${formatNumber(p.pnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});