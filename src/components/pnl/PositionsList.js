import { memo, useState, useMemo, useEffect } from 'react';
import styles from './PositionsList.module.scss';
import { PnLCard } from './PnLCard';
import { PositionChart } from './PositionChart';
import { ClusterBar } from './ClusterBar';
import { PriceBar } from './PriceBar';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import { formatNumber, formatDuration, formatWalletAddress } from '../../utils/formatters';
import { getValueClass, getStateClass, calculatePnlPercentage, calculateStatus } from '../../utils/positionUtils';
import { invertPairString, getAdjustedPosition } from '../../utils/pairUtils';
import { copyToClipboard } from '../../utils/notifications';

export const PositionsList = memo(({ positions, showWallet = false, historyEnabled }) => {
  const [sortField, setSortField] = useState('age');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [chartPosition, setChartPosition] = useState(null);
  const { getPositionHistory } = useHistoricalData();
  const [invertedPairs, setInvertedPairs] = useState(new Set());

  // Load inverted pairs from localStorage on mount
  useEffect(() => {
    const savedInvertedPairs = localStorage.getItem('invertedPairs');
    if (savedInvertedPairs) {
      setInvertedPairs(new Set(JSON.parse(savedInvertedPairs)));
    }
  }, []);

  // Save inverted pairs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('invertedPairs', JSON.stringify(Array.from(invertedPairs)));
  }, [invertedPairs]);

  const handlePairInversion = (pair) => {
    setInvertedPairs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pair)) {
        newSet.delete(pair);
      } else {
        newSet.add(pair);
      }
      return newSet;
    });
  };

  const isInverted = (pair) => invertedPairs.has(pair);

  const handleSort = (field) => {
    if (positions.length <= 1) return;
    
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
    }
  };
  
  // Apply position adjustments and client-side formatting
  const processedPositions = useMemo(() => {
    if (!positions) return [];

    // First, sort the positions
    const sorted = [...positions].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Special handling for nested objects
      if (sortField === 'pnl') {
        aValue = a.pnl.usd;
        bValue = b.pnl.usd;
      } else if (sortField === 'yield') {
        aValue = a.yield.usd;
        bValue = b.yield.usd;
      } else if (sortField === 'status') {
        // Calculate status for sorting comparison
        const aStatus = calculateStatus(a);
        const bStatus = calculateStatus(b);
        aValue = aStatus;
        bValue = bStatus;
      }
      
      // String comparison (including calculated status)
      if (['pair', 'state', 'walletAddress', 'status'].includes(sortField)) {
        aValue = String(aValue || '');
        bValue = String(bValue || '');
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Age comparison
      if (sortField === 'age') {
        // Handle null/undefined ages during sort
        aValue = a.age ?? (sortDirection === 'asc' ? Infinity : -Infinity);
        bValue = b.age ?? (sortDirection === 'asc' ? Infinity : -Infinity);
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Default numeric fields
      aValue = Number(aValue || 0);
      bValue = Number(bValue || 0);
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Then, apply adjustments and final formatting for display
    return sorted.map(position => {
      const inverted = isInverted(position.pair);
      const adjusted = getAdjustedPosition(position, inverted);
      
      // Calculate display values
      const displayStatus = calculateStatus(position);
      const displayPnlPercentage = calculatePnlPercentage(position.pnl?.bps);

      return {
        ...adjusted, // Contains adjusted prices etc.
        displayStatus, // Add calculated status for display
        displayPnlPercentage, // Add calculated percentage for display
      };
    });
  }, [positions, sortField, sortDirection, invertedPairs]);

  const getSortIcon = (field) => {
    if (positions.length <= 1) return null;
    if (field !== sortField) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleShowChart = async (position) => {
    const positionId = `${position.pair}-${position.positionAddress}`;
    const history = await getPositionHistory(positionId);
    setChartPosition({ ...position, history });
  };

  if (!positions || positions.length === 0) {
    return <div className={styles.noData}>No positions found</div>;
  }

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
          {processedPositions.map((p, i) => (
            <tr key={`${p.pair}-${p.positionAddress}-${i}`}>
              <td>
                <span 
                  className={`${styles.positionLabel} ${isInverted(p.pair) ? styles.invertedPair : ''}`}
                  onClick={() => handlePairInversion(p.pair)}
                  title={`Click to ${isInverted(p.pair) ? 'restore' : 'invert'} token order`}
                >
                  {isInverted(p.pair) ? invertPairString(p.pair) : p.pair}
                  {isInverted(p.pair) && (
                    <span className={styles.invertedIndicator}>↔</span>
                  )}
                </span>
                <span className={styles.positionLeverage}>({formatNumber(p.leverage)}x Leverage)</span>
              </td>
              {showWallet && (
                <td 
                  title="Copy to clipboard"
                  onClick={() => copyToClipboard(p.walletAddress)}
                  className={styles.walletCell}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      copyToClipboard(p.walletAddress);
                    }
                  }}
                >
                  {formatWalletAddress(p.walletAddress)}
                </td>
              )}
              <td className={styles[getStateClass(p.displayStatus)]}>{p.displayStatus}</td>
              <td>{formatDuration(p.age)}</td>
              <td className={styles[getValueClass(p.pnl.usd)]}>
                ${formatNumber(p.pnl.usd)} 
                <span className={styles.positionPnlPercentage}> ({p.displayPnlPercentage}%)</span>
              </td>
              <td className={styles[getValueClass(p.yield.usd)]}>${formatNumber(p.yield.usd)}</td>
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
                  isInverted={isInverted(p.pair)}
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
                {historyEnabled && (
                  <button 
                    className={styles.chartButton}
                    onClick={() => handleShowChart(p)}
                    aria-label="View position history chart"
                    title="View position performance chart"
                  >
                    Chart
                  </button>
                )}
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