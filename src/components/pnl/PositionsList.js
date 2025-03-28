import { memo, useState } from 'react';
import styles from './PositionsList.module.scss';
import { PnLCard } from './PnLCard';
import { PositionChart } from './PositionChart';
import { useHistoricalData } from '../../hooks/useHistoricalData';

export const PositionsList = memo(({ positions, formatValue, showWallet = false }) => {
  const [sortField, setSortField] = useState('pnl');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [chartPosition, setChartPosition] = useState(null);
  const { getPositionHistory } = useHistoricalData();
  
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
  
  const formatWalletAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if clicking on the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new field
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getSortedPositions = () => {
    if (!positions) return [];
    
    return [...positions].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Special handling for string fields
      if (sortField === 'pair' || sortField === 'state' || sortField === 'age' || sortField === 'walletAddress') {
        aValue = String(aValue || '');
        bValue = String(bValue || '');
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Numeric fields
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };
  
  const getSortIcon = (field) => {
    if (field !== sortField) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleShowChart = async (position) => {
    const positionId = `${position.pair}-${position.walletAddress || 'default'}`;
    const history = await getPositionHistory(positionId);
    setChartPosition({ ...position, history });
  };

  if (!positions || positions.length === 0) {
    return <div className={styles.noData}>No positions found</div>;
  }
  
  const sortedPositions = getSortedPositions();

  return (
    <div className={styles.positionsContainer}>
      <table className={styles.positionsTable}>
        <thead>
          <tr>
            <th onClick={() => handleSort('pair')} className={styles.sortable}>
              Pair {getSortIcon('pair')}
            </th>
            {showWallet && (
              <th onClick={() => handleSort('walletAddress')} className={styles.sortable}>
                Wallet {getSortIcon('walletAddress')}
              </th>
            )}
            <th onClick={() => handleSort('state')} className={styles.sortable}>
              State {getSortIcon('state')}
            </th>
            <th onClick={() => handleSort('age')} className={styles.sortable}>
              Age {getSortIcon('age')}
            </th>
            <th onClick={() => handleSort('yield')} className={styles.sortable}>
              Yield {getSortIcon('yield')}
            </th>
            <th onClick={() => handleSort('compounded')} className={styles.sortable}>
              Compounded {getSortIcon('compounded')}
            </th>
            <th onClick={() => handleSort('debt')} className={styles.sortable}>
              Debt Change {getSortIcon('debt')}
            </th>
            <th onClick={() => handleSort('pnl')} className={styles.sortable}>
              PnL {getSortIcon('pnl')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPositions.map((p, i) => (
            <tr key={`${p.pair}-${p.walletAddress || ''}-${i}`}>
              <td>{p.pair}</td>
              {showWallet && (
                <td className={styles.walletCell} title={p.walletAddress}>
                  {formatWalletAddress(p.walletAddress)}
                </td>
              )}
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
              <td>
                <button 
                  className={styles.shareButton}
                  onClick={() => setSelectedPosition(p)}
                  aria-label="Share position"
                >
                  Share
                </button>
                <button 
                  className={styles.chartButton}
                  onClick={() => handleShowChart(p)}
                  aria-label="View position history chart"
                >
                  Chart
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedPosition && (
        <PnLCard
          position={selectedPosition}
          onClose={() => setSelectedPosition(null)}
        />
      )}

      {chartPosition && (
        <PositionChart
          positionHistory={chartPosition.history}
          onClose={() => setChartPosition(null)}
        />
      )}
    </div>
  );
});