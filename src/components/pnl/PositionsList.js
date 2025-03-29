import { memo, useState } from 'react';
import styles from './PositionsList.module.scss';
import { PnLCard } from './PnLCard';
import { PositionChart } from './PositionChart';
import { ClusterBar } from './ClusterBar';
import { PriceBar } from './PriceBar';
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
      case 'In range': return styles.stateInRange;
      case 'Out of range': return styles.stateWarning;
      case 'Closed': return styles.stateClosed;
      case 'Liquidated': return styles.stateLiquidated;
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

  const formatPrice = (price) => {
    if (price === Infinity) return '∞';
    if (price === 0) return '0';
    return formatNumber(price);
  };
  
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getSortedPositions = () => {
    if (!positions) return [];
    
    return [...positions].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Special handling for nested objects
      if (sortField === 'priceRange') {
        aValue = a.priceRange.lower;
        bValue = b.priceRange.lower;
      }
      
      // Special handling for string fields
      if (['pair', 'state', 'age', 'walletAddress', 'status'].includes(sortField)) {
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
            <th onClick={() => handleSort('status')} className={styles.sortable}>
              Status {getSortIcon('status')}
            </th>
            <th onClick={() => handleSort('age')} className={styles.sortable}>
              Age {getSortIcon('age')}
            </th>
            <th onClick={() => handleSort('pnl')} className={styles.sortable}>
              PnL {getSortIcon('pnl')}
            </th>
            <th  onClick={() => handleSort('size')} className={styles.sortable}>
              Position Details {getSortIcon('size')}
            </th>
            <th>
              Price Range
            </th>
            <th onClick={() => handleSort('yield')} className={styles.sortable}>
              Yield {getSortIcon('yield')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPositions.map((p, i) => (
            <tr key={`${p.pair}-${p.walletAddress || ''}-${i}`}>
              <td><span className={styles.positionLabel}>{p.pair}</span> ({p.leverage} Leverage)</td>
              {showWallet && (
                <td title={p.walletAddress}>
                  {formatWalletAddress(p.walletAddress)}
                </td>
              )}
              <td className={getStateClass(p.status)}>{p.status}</td>
              <td>{formatDuration(p.age)}</td>
              <td className={getValueClass(p.pnl.usd)}>{formatNumber(p.pnl.usd)} ({p.pnl.percentage}%)</td>
              <td>
                <ClusterBar
                  size={p.size}
                  collateral={p.collateral}
                  debt={p.debt}
                  interest={p.interest}
                  formatValue={formatNumber}
                />
              </td>
              <td>
                <PriceBar
                  currentPrice={p.currentPrice}
                  entryPrice={p.entryPrice}
                  liquidationPrice={p.liquidationPrice}
                  rangePrices={p.rangePrices}
                  limitOrderPrices={p.limitOrderPrices}
                  formatValue={formatNumber}
                />
              </td>
              <td className={getValueClass(p.yield)}>{formatNumber(p.yield.usd)}</td>
              <td>
                <button 
                  className={styles.shareButton}
                  onClick={() => setSelectedPosition(p)}
                  aria-label="Share position"
                  title="Share position details"
                >
                  Share
                </button>
                <button 
                  className={styles.chartButton}
                  onClick={() => handleShowChart(p)}
                  aria-label="View position history chart"
                  title="View position performance chart"
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