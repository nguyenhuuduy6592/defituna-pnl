import { memo, useCallback, useMemo } from 'react';
import { ClusterBar } from './ClusterBar';
import { PriceBar } from './PriceBar';
import {
  formatNumber,
  formatDuration,
  formatWalletAddress,
  getValueClass,
  getStateClass,
  invertPairString,
  copyToClipboard,
  formatPercentage,
} from '../../utils';
import { FiShare2, FiCopy } from 'react-icons/fi';
import styles from './PositionsTable.module.scss';
import { usePriceContext } from '../../contexts/PriceContext';
import { useDisplayCurrency } from '../../contexts/DisplayCurrencyContext';
import { KNOWN_TOKENS } from '../../utils/constants';

/**
 * Table header with sort functionality
 */
const TableHeader = memo(
  ({ showWallet, positionsCount, sortState, onSort }) => {
    // Helper function to get the appropriate sort icon
    const getSortIcon = useCallback(
      (field) => {
        if (positionsCount <= 1) {
          return null;
        }
        if (field !== sortState.field) {
          return '↕';
        }
        return sortState.direction === 'asc' ? '↑' : '↓';
      },
      [positionsCount, sortState]
    );

    // Determine if header is sortable
    const isSortable = positionsCount > 1;

    // Handler for header click
    const handleHeaderClick = useCallback(
      (field) => {
        if (isSortable) {
          onSort(field);
        }
      },
      [isSortable, onSort]
    );

    return (
      <thead>
        <tr>
          <th
            className={isSortable ? styles.sortable : ''}
            onClick={() => handleHeaderClick('pair')}
            tabIndex={isSortable ? 0 : -1}
            role={isSortable ? 'button' : undefined}
            aria-sort={
              sortState.field === 'pair' ? sortState.direction : undefined
            }
          >
            Pair {getSortIcon('pair')}
          </th>
          {showWallet && (
            <th
              className={isSortable ? styles.sortable : ''}
              onClick={() => handleHeaderClick('walletAddress')}
              tabIndex={isSortable ? 0 : -1}
              role={isSortable ? 'button' : undefined}
              aria-sort={
                sortState.field === 'walletAddress'
                  ? sortState.direction
                  : undefined
              }
            >
              Wallet {getSortIcon('walletAddress')}
            </th>
          )}
          <th
            className={isSortable ? styles.sortable : ''}
            onClick={() => handleHeaderClick('status')}
            tabIndex={isSortable ? 0 : -1}
            role={isSortable ? 'button' : undefined}
            aria-sort={
              sortState.field === 'status' ? sortState.direction : undefined
            }
          >
            Status {getSortIcon('status')}
          </th>
          <th
            className={isSortable ? styles.sortable : ''}
            onClick={() => handleHeaderClick('age')}
            tabIndex={isSortable ? 0 : -1}
            role={isSortable ? 'button' : undefined}
            aria-sort={
              sortState.field === 'age' ? sortState.direction : undefined
            }
          >
            Age {getSortIcon('age')}
          </th>
          <th
            className={isSortable ? styles.sortable : ''}
            onClick={() => handleHeaderClick('pnl')}
            tabIndex={isSortable ? 0 : -1}
            role={isSortable ? 'button' : undefined}
            aria-sort={
              sortState.field === 'pnl' ? sortState.direction : undefined
            }
          >
            PnL {getSortIcon('pnl')}
          </th>
          <th
            className={isSortable ? styles.sortable : ''}
            onClick={() => handleHeaderClick('yield')}
            tabIndex={isSortable ? 0 : -1}
            role={isSortable ? 'button' : undefined}
            aria-sort={
              sortState.field === 'yield' ? sortState.direction : undefined
            }
          >
            Yield (Compounded) {getSortIcon('yield')}
          </th>
          <th
            className={isSortable ? styles.sortable : ''}
            onClick={() => handleHeaderClick('size')}
            tabIndex={isSortable ? 0 : -1}
            role={isSortable ? 'button' : undefined}
            aria-sort={
              sortState.field === 'size' ? sortState.direction : undefined
            }
          >
            Position Details {getSortIcon('size')}
          </th>
          <th>Price Range</th>
          <th>Actions</th>
        </tr>
      </thead>
    );
  }
);

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
  const formattedLeverage =
    leverage === 1 ? null : (
      <>
        ({formatNumber(leverage)}x<span className={styles.hideOnMobile}></span>)
      </>
    );
  const invertTooltip = `Click to ${isInverted ? 'restore' : 'invert'} token order`;

  return (
    <td data-label="Pair">
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
      <span className={styles.positionLeverage}>{formattedLeverage}</span>
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

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        copyToClipboard(walletAddress);
      }
    },
    [walletAddress]
  );

  const formattedAddress = formatWalletAddress(walletAddress);

  return (
    <td className={styles.walletCell} data-label="Wallet">
      <div
        className={styles.walletCellContent}
        onClick={handleCopy}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        title="Copy wallet address"
        aria-label={`Copy wallet address ${formattedAddress}`}
      >
        <span>{formattedAddress}</span>
        <FiCopy className={styles.copyIcon} />
      </div>
    </td>
  );
});

WalletCell.displayName = 'WalletCell';

// Export for testing
export { WalletCell };

/**
 * Action buttons cell
 */
const ActionsCell = memo(
  ({ position, historyEnabled, onShare, onShowChart }) => {
    const handleShare = useCallback(() => {
      onShare(position);
    }, [position, onShare]);

    const handleShowChart = useCallback(() => {
      onShowChart(position);
    }, [position, onShowChart]);

    return (
      <td data-label="Actions">
        <button
          className={styles.shareButton}
          onClick={handleShare}
          aria-label={`Share ${position.pair} position`}
          title="Share position details"
        >
          <FiShare2 size={14} />
          <span>Share</span>
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
  }
);

ActionsCell.displayName = 'ActionsCell';

// Export for testing
export { ActionsCell };

/**
 * The value cell with USD/SOL equivalent and percentage
 */
const ValueCell = memo(({ value, size, label, pnlData, symbol }) => {
  const { solPrice } = usePriceContext();
  const { showInSol } = useDisplayCurrency();
  const pnlClass = useMemo(() => {
    let numericValueForColoring = 0;

    if (showInSol && pnlData && symbol) {
      const tokenASymbol = symbol.a;
      const tokenBSymbol = symbol.b;
      if (tokenASymbol === KNOWN_TOKENS.SOL.symbol) {
        numericValueForColoring = pnlData.pnl_a.amount;
      } else if (tokenBSymbol === KNOWN_TOKENS.SOL.symbol) {
        numericValueForColoring = pnlData.pnl_b.amount;
      } else {
        numericValueForColoring = value === null ? 0 : value; // USD display mode
      }
    } else {
      numericValueForColoring = value === null ? 0 : value; // USD display mode
    }

    return getValueClass(numericValueForColoring);
  }, [value, showInSol, pnlData, symbol]);

  const displayedValue = useMemo(() => {
    if (value === null) {
      // Handle null or undefined USD value first
      return showInSol ? 'N/A SOL' : 'N/A USD';
    }

    if (showInSol) {
      if (pnlData && symbol) {
        const tokenASymbol = symbol.a;
        const tokenBSymbol = symbol.b;
        if (tokenASymbol === KNOWN_TOKENS.SOL.symbol) {
          return `${formatNumber(pnlData.pnl_a.amount)} SOL`;
        } else if (tokenBSymbol === KNOWN_TOKENS.SOL.symbol) {
          return `${formatNumber(pnlData.pnl_b.amount)} SOL`;
        }
      }

      if (value === 0) {
        // Explicitly check for zero USD value
        return `${formatNumber(0)} SOL`; // Or formatNumber(0, 2, true).trim()
      }
      // For non-zero USD values, solPrice is required
      if (solPrice !== null) {
        const solAmount = value / solPrice;
        return `${formatNumber(solAmount)} SOL`; // Assuming formatNumber handles precision for SOL
      }
      return 'N/A SOL'; // Fallback if non-zero and solPrice is missing
    } else {
      return `$${formatNumber(value)}`;
    }
  }, [value, solPrice, showInSol, pnlData, symbol]);

  // Percentage is always based on USD value relative to size
  const percentageString = useMemo(() => {
    if (showInSol && pnlData && symbol) {
      const tokenASymbol = symbol.a;
      const tokenBSymbol = symbol.b;
      if (tokenASymbol === KNOWN_TOKENS.SOL.symbol) {
        return `(${formatPercentage(pnlData.pnl_a.bps / 10000)})`;
      } else if (tokenBSymbol === KNOWN_TOKENS.SOL.symbol) {
        return `(${formatPercentage(pnlData.pnl_b.bps / 10000)})`;
      }

      return `(${formatPercentage(pnlData.pnl_usd.bps / 10000)})`;
    }

    if (value !== null && size !== null && size !== 0) {
      return `(${formatPercentage(value / size)})`;
    }
    return null;
  }, [value, size, showInSol, pnlData, symbol]);

  return (
    <td
      className={`${styles.valueCell} ${styles[pnlClass]}`}
      data-label={label}
    >
      <div className={styles.primaryValue}>
        {displayedValue}
        {percentageString && (
          <span className={styles.positionPnlPercentage}>
            {percentageString}
          </span>
        )}
      </div>
    </td>
  );
});

ValueCell.displayName = 'ValueCell';

/**
 * The pnl cell with USD/SOL equivalent and percentage
 */
const PnlCell = memo(({ pnlData }) => {
  const { showInSol } = useDisplayCurrency();
  const pnlClass = showInSol ? pnlData.pnlClassInSol : pnlData.pnlClass;
  const displayedValue = showInSol
    ? pnlData.displayedValueInSol
    : pnlData.displayedValue;
  const percentageString = showInSol
    ? pnlData.percentageStringInSol
    : pnlData.percentageString;

  return (
    <td className={`${styles.valueCell} ${styles[pnlClass]}`} data-label="PnL">
      <div className={styles.primaryValue}>
        {displayedValue}
        {percentageString && (
          <span className={styles.positionPnlPercentage}>
            {percentageString}
          </span>
        )}
      </div>
    </td>
  );
});

PnlCell.displayName = 'PnlCell';

/**
 * The pnl cell with USD/SOL equivalent and percentage
 */
const YieldCell = memo(({ yieldData, compoundedData }) => {
  const { showInSol } = useDisplayCurrency();
  const yieldClass = showInSol
    ? yieldData.yieldClassInSol
    : yieldData.yieldClass;
  const yieldValue = showInSol
    ? yieldData.displayedValueInSol
    : yieldData.displayedValue;
  const compoundedValue = showInSol
    ? compoundedData.displayedValueInSol
    : compoundedData.displayedValue;
  return (
    <td
      className={`${styles.valueCell} ${styles[yieldClass]}`}
      data-label="Yield (Compounded)"
    >
      <div className={styles.primaryValue}>
        <div dangerouslySetInnerHTML={{ __html: yieldValue }} />
        <div dangerouslySetInnerHTML={{ __html: `(${compoundedValue})` }} />
      </div>
    </td>
  );
});

YieldCell.displayName = 'YieldCell';

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
export const PositionsTable = memo(
  ({
    positions,
    showWallet,
    historyEnabled,
    sortState,
    onSort,
    isInverted,
    onPairInversion,
    onShare,
    onShowChart,
  }) => {
    const { solPrice } = usePriceContext();
    const { showInSol } = useDisplayCurrency();

    return (
      <table className={styles.positionsTable} aria-label="Position details">
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
                <td
                  data-label="Status"
                  className={styles[getStateClass(position.displayStatus)]}
                >
                  {position.displayStatus}
                </td>
                <td data-label="Age">{formatDuration(position.age)}</td>
                <PnlCell pnlData={position.pnlData} />
                <YieldCell
                  yieldData={position.yieldData}
                  compoundedData={position.compoundedData}
                />
                <td data-label="Position Details">
                  <ClusterBar
                    size={position.size}
                    collateral={position.collateral}
                    debt={position.debt}
                    interest={position.interest}
                    formatValue={formatNumber}
                    solPrice={solPrice}
                    showInSol={showInSol}
                  />
                </td>
                <td data-label="Price Range">
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
  }
);

PositionsTable.displayName = 'PositionsTable';
