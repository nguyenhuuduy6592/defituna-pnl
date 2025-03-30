import { memo } from 'react';
import { ClusterBar } from './ClusterBar';
import { PriceBar } from './PriceBar';
import {
  formatNumber,
  formatDuration,
  formatWalletAddress,
  getValueClass,
  getStateClass,
  invertPairString,
  copyToClipboard
} from '../../utils';
import styles from './PositionsTable.module.scss';

export const PositionsTable = memo(({
  positions,
  showWallet,
  historyEnabled,
  sortState,
  onSort,
  isInverted,
  onPairInversion,
  onShare,
  onShowChart
}) => {
  const getSortIcon = (field) => {
    if (positions.length <= 1) return null;
    if (field !== sortState.field) return '↕';
    return sortState.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <table className={styles.positionsTable}>
      <thead>
        <tr>
          <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => onSort('pair')}>
            Pair {getSortIcon('pair')}
          </th>
          {showWallet && (
            <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => onSort('walletAddress')}>
              Wallet {getSortIcon('walletAddress')}
            </th>
          )}
          <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => onSort('status')}>
            Status {getSortIcon('status')}
          </th>
          <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => onSort('age')}>
            Age {getSortIcon('age')}
          </th>
          <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => onSort('pnl')}>
            PnL {getSortIcon('pnl')}
          </th>
          <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => onSort('yield')}>
            Yield {getSortIcon('yield')}
          </th>
          <th className={positions.length > 1 ? styles.sortable : ''} onClick={() => onSort('size')}>
            Position Details {getSortIcon('size')}
          </th>
          <th>Price Range</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p, i) => (
          <tr key={`${p.pair}-${p.positionAddress}-${i}`}>
            <td>
              <span 
                className={`${styles.positionLabel} ${isInverted(p.pair) ? styles.invertedPair : ''}`}
                onClick={() => onPairInversion(p.pair)}
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
                onClick={() => onShare(p)}
                aria-label="Share position"
                title="Share position details"
              >
                Share
              </button>
              {historyEnabled && (
                <button 
                  className={styles.chartButton}
                  onClick={() => onShowChart(p)}
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
  );
}); 