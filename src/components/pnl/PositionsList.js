import { memo, useState } from 'react';
import styles from './PositionsList.module.scss';
import { PnLCard } from './PnLCard';
import { PositionChart } from './PositionChart';
import { ClusterBar } from './ClusterBar';
import { PriceBar } from './PriceBar';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import { formatNumber, formatDuration, formatWalletAddress } from '../../utils/formatters';

export const PositionsList = memo(({ positions, showWallet = false }) => {
  const [sortField, setSortField] = useState('age');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [chartPosition, setChartPosition] = useState(null);
  const { getPositionHistory } = useHistoricalData();

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

  const handleSort = (field) => {
    if (positions.length <= 1) return;
    
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
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
      } else if (sortField === 'pnl') {
        aValue = a.pnl.usd;
        bValue = b.pnl.usd;
      } else if (sortField === 'yield') {
        aValue = a.yield.usd;
        bValue = b.yield.usd;
      }
      
      // Special handling for string fields
      if (['pair', 'state', 'walletAddress', 'status'].includes(sortField)) {
        aValue = String(aValue || '');
        bValue = String(bValue || '');
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Special handling for age field
      if (sortField === 'age') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Numeric fields
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };
  
  const getSortIcon = (field) => {
    if (positions.length <= 1) return null;
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
            <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => handleSort('pair')}>
              Pair {getSortIcon('pair')}
            </th>
            {showWallet && (
              <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => handleSort('walletAddress')}>
                Wallet {getSortIcon('walletAddress')}
              </th>
            )}
            <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => handleSort('status')}>
              Status {getSortIcon('status')}
            </th>
            <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => handleSort('age')}>
              Age {getSortIcon('age')}
            </th>
            <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => handleSort('pnl')}>
              PnL {getSortIcon('pnl')}
            </th>
            <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => handleSort('yield')}>
              Yield {getSortIcon('yield')}
            </th>
            <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => handleSort('size')}>
              Position Details {getSortIcon('size')}
            </th>
            <th>
              Price Range
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPositions.map((p, i) => (
            <tr key={`${p.pair}-${p.walletAddress || ''}-${i}`}>
              <td><span className={styles.positionLabel}>{p.pair}</span> <span className={styles.positionLeverage}>({p.leverage}x Leverage)</span></td>
              {showWallet && (
                <td title={p.walletAddress}>
                  {formatWalletAddress(p.walletAddress)}
                </td>
              )}
              <td className={getStateClass(p.status)}>{p.status}</td>
              <td>{formatDuration(p.age)}</td>
              <td className={getValueClass(p.pnl.usd)}>${formatNumber(p.pnl.usd)} <span className={styles.positionPnlPercentage}>({p.pnl.percentage}%)</span></td>
              <td className={getValueClass(p.yield.usd)}>{formatNumber(p.yield.usd)}</td>
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