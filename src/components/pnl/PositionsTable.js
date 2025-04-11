import { memo, useCallback } from 'react';
import { ClusterBar } from '@/components/pnl/ClusterBar';
import { PriceBar } from '@/components/pnl/PriceBar';
import {
  formatNumber,
  formatDuration,
  formatWalletAddress,
  getValueClass,
  getStateClass,
  invertPairString,
  copyToClipboard
} from '@/utils';
import styles from '@/styles/PositionsTable.module.scss';

/**
 * Table header with sort functionality
 */
const TableHeader = memo(({ showWallet, positionsCount, sortState, onSort }) => {
  // Helper function to get the appropriate sort icon
  const getSortIcon = useCallback((field) => {
    if (positionsCount <= 1) return null;
    if (field !== sortState.field) return '↕';
    return sortState.direction === 'asc' ? '↑' : '↓';
  }, [positionsCount, sortState]);

  // Determine if header is sortable
  const isSortable = positionsCount > 1;
  
  // Handler for header click
  const handleHeaderClick = useCallback((field) => {
    if (isSortable) onSort(field);
  }, [isSortable, onSort]);
  
  return (
    <thead>
      <tr>
        <th 
          className={isSortable ? styles.sortable : ''}
          onClick={() => handleHeaderClick('pair')}
          tabIndex={isSortable ? 0 : -1}
          role={isSortable ? 'button' : undefined}
          aria-sort={sortState.field === 'pair' ? sortState.direction : undefined}
        >
          Pair {getSortIcon('pair')}
        </th>
        {showWallet && (
          <th 
            className={isSortable ? styles.sortable : ''}
            onClick={() => handleHeaderClick('walletAddress')}
            tabIndex={isSortable ? 0 : -1}
            role={isSortable ? 'button' : undefined}
            aria-sort={sortState.field === 'walletAddress' ? sortState.direction : undefined}
          >
            Wallet {getSortIcon('walletAddress')}
          </th>
        )}
        <th 
          className={isSortable ? styles.sortable : ''}
          onClick={() => handleHeaderClick('status')}
          tabIndex={isSortable ? 0 : -1}
          role={isSortable ? 'button' : undefined}
          aria-sort={sortState.field === 'status' ? sortState.direction : undefined}
        >
          Status {getSortIcon('status')}
        </th>
        <th 
          className={isSortable ? styles.sortable : ''}
          onClick={() => handleHeaderClick('age')}
          tabIndex={isSortable ? 0 : -1}
          role={isSortable ? 'button' : undefined}
          aria-sort={sortState.field === 'age' ? sortState.direction : undefined}
        >
          Age {getSortIcon('age')}
        </th>
        <th 
          className={isSortable ? styles.sortable : ''}
          onClick={() => handleHeaderClick('pnl')}
          tabIndex={isSortable ? 0 : -1}
          role={isSortable ? 'button' : undefined}
          aria-sort={sortState.field === 'pnl' ? sortState.direction : undefined}
        >
          PnL {getSortIcon('pnl')}
        </th>
        <th 
          className={isSortable ? styles.sortable : ''}
          onClick={() => handleHeaderClick('yield')}
          tabIndex={isSortable ? 0 : -1}
          role={isSortable ? 'button' : undefined}
          aria-sort={sortState.field === 'yield' ? sortState.direction : undefined}
        >
          Yield {getSortIcon('yield')}
        </th>
        <th 
          className={isSortable ? styles.sortable : ''}
          onClick={() => handleHeaderClick('size')}
          tabIndex={isSortable ? 0 : -1}
          role={isSortable ? 'button' : undefined}
          aria-sort={sortState.field === 'size' ? sortState.direction : undefined}
        >
          Position Details {getSortIcon('size')}
        </th>
        <th>Price Range</th>
        <th>Actions</th>
      </tr>
    </thead>
  );
});

TableHeader.displayName = 'TableHeader';

// Export for testing
export { TableHeader };

/**
 * The pair cell with inversion support
 */
const PairCell = memo(({ pair, isInverted, leverage, onPairInversion }) => {
  const handleClick = useCallback(() => {
    onPairInversion(pair);
  }, [pair, onPairInversion]);
  
  const displayPair = isInverted ? invertPairString(pair) : pair;
  const formattedLeverage = formatNumber(leverage);
  const invertTooltip = `Click to ${isInverted ? 'restore' : 'invert'} token order`;
  
  return (
    <td>
      <span 
        className={`${styles.positionLabel} ${isInverted ? styles.invertedPair : ''}`}
        onClick={handleClick}
        title={invertTooltip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onPairInversion(pair);
          }
        }}
      >
        {displayPair}
        {isInverted && <span className={styles.invertedIndicator}>↔</span>}
      </span>
      <span className={styles.positionLeverage}>({formattedLeverage}x Leverage)</span>
    </td>
  );
});

PairCell.displayName = 'PairCell';

// Export for testing
export { PairCell };

/**
 * The wallet address cell with copy functionality
 */
const WalletCell = memo(({ walletAddress }) => {
  const handleCopy = useCallback(() => {
    copyToClipboard(walletAddress);
  }, [walletAddress]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      copyToClipboard(walletAddress);
    }
  }, [walletAddress]);
  
  const formattedAddress = formatWalletAddress(walletAddress);
  
  return (
    <td 
      title="Copy to clipboard"
      onClick={handleCopy}
      className={styles.walletCell}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Copy wallet address ${formattedAddress}`}
    >
      {formattedAddress}
    </td>
  );
});

WalletCell.displayName = 'WalletCell';

// Export for testing
export { WalletCell };

/**
 * Action buttons cell
 */
const ActionsCell = memo(({ position, historyEnabled, onShare, onShowChart }) => {
  const handleShare = useCallback(() => {
    onShare(position);
  }, [position, onShare]);
  
  const handleShowChart = useCallback(() => {
    onShowChart(position);
  }, [position, onShowChart]);
  
  return (
    <td>
      <button 
        className={styles.shareButton}
        onClick={handleShare}
        aria-label={`Share ${position.pair} position`}
        title="Share position details"
      >
        Share
      </button>
      {historyEnabled && (
        <button 
          className={styles.chartButton}
          onClick={handleShowChart}
          aria-label={`View ${position.pair} position history chart`}
          title="View position performance chart"
        >
          Chart
        </button>
      )}
    </td>
  );
});

ActionsCell.displayName = 'ActionsCell';

// Export for testing
export { ActionsCell };

/**
 * A table component that displays position data with sorting and interactive features
 * 
 * @param {Object} props Component props
 * @param {Array} props.positions List of position objects to display
 * @param {boolean} props.showWallet Whether to show wallet addresses
 * @param {boolean} props.historyEnabled Whether history/chart feature is enabled
 * @param {Object} props.sortState Current sort state (field and direction)
 * @param {Function} props.onSort Callback when sort header is clicked
 * @param {Function} props.isInverted Function to check if a pair is displayed inverted
 * @param {Function} props.onPairInversion Callback to invert a pair display
 * @param {Function} props.onShare Callback to share a position
 * @param {Function} props.onShowChart Callback to show position history chart
 */
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
  return (
    <table 
      className={styles.positionsTable}
      aria-label="Position details"
    >
      <TableHeader
        showWallet={showWallet}
        positionsCount={positions.length}
        sortState={sortState}
        onSort={onSort}
      />
      <tbody>
        {positions.map((position, index) => {
          const key = `${position.pair}-${position.positionAddress}-${index}`;
          const isPairInverted = isInverted(position.pair);
          
          return (
            <tr key={key}>
              <PairCell 
                pair={position.pair}
                isInverted={isPairInverted}
                leverage={position.leverage}
                onPairInversion={onPairInversion}
              />
              
              {showWallet && (
                <WalletCell walletAddress={position.walletAddress} />
              )}
              
              <td className={styles[getStateClass(position.displayStatus)]}>
                {position.displayStatus}
              </td>
              
              <td>{formatDuration(position.age)}</td>
              
              <td className={styles[getValueClass(position.pnl.usd)]}>
                ${formatNumber(position.pnl.usd)} 
                <span className={styles.positionPnlPercentage}> 
                  ({position.displayPnlPercentage}%)
                </span>
              </td>
              
              <td className={styles[getValueClass(position.yield.usd)]}>
                ${formatNumber(position.yield.usd)}
              </td>
              
              <td>
                <ClusterBar
                  size={position.size}
                  collateral={position.collateral}
                  debt={position.debt}
                  interest={position.interest}
                  formatValue={formatNumber}
                />
              </td>
              
              <td>
                <PriceBar
                  currentPrice={position.currentPrice}
                  entryPrice={position.entryPrice}
                  liquidationPrice={position.liquidationPrice}
                  rangePrices={position.rangePrices}
                  limitOrderPrices={position.limitOrderPrices}
                  formatValue={formatNumber}
                  isInverted={isPairInverted}
                />
              </td>
              
              <ActionsCell 
                position={position}
                historyEnabled={historyEnabled}
                onShare={onShare}
                onShowChart={onShowChart}
              />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}); 