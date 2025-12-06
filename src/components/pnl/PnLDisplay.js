import { useMemo } from 'react';
import { PositionsList } from './PositionsList';
import { DonationFooter } from './DonationFooter';
import { TotalPnLDisplay } from './TotalPnLDisplay';
import styles from './PnLDisplay.module.scss';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { usePositionAges } from './hooks/usePositionAges';
import { CurrencyToggle } from '../common/CurrencyToggle';
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';
import { getValueClass, formatNumber, formatPercentage } from '@/utils';

// Default structure when data is not yet available
const defaultData = {
  totalPnL: 0,
  positions: [],
  walletCount: 0,
};

/**
 * Component for displaying PnL data and positions with loading state
 *
 * @param {Object} props Component props
 * @param {Object} props.data Data containing PnL and positions information
 * @param {boolean} props.historyEnabled Whether position history is enabled
 * @param {boolean} props.loading Whether data is currently loading
 * @returns {JSX.Element} Rendered component
 */
export const PnLDisplay = ({
  data,
  historyEnabled = false,
  loading = false,
}) => {
  const { showInSol } = useDisplayCurrency();

  // Use provided data or default data
  const displayData = useMemo(() => {
    if (!data) {
      return defaultData;
    }

    const positions = Array.isArray(data.positions) ? data.positions : [];

    // for each position, add the pnlClass, displayedValue, and percentageString
    const formattedPositions = positions.map((position) => {
      // Create new objects to avoid mutating props
      const newPosition = {
        ...position,
        pnlData: {
          ...position.pnlData,
          token_pnl: [...position.pnlData.token_pnl],
        },
        yieldData: {
          ...position.yieldData,
          tokens: [...position.yieldData.tokens],
        },
        compoundedData: {
          ...position.compoundedData,
          tokens: [...position.compoundedData.tokens],
        },
      };

      // ----- START: PNL formatting -----
      const pnlTokenValue = newPosition.pnlData.token_pnl.reduce(
        (sum, token) => sum + token.amount,
        0
      );
      const pnlUsdValue = newPosition.pnlData.pnl_usd.amount;
      newPosition.pnlData.pnlClass = getValueClass(pnlUsdValue);
      newPosition.pnlData.pnlClassInSol = getValueClass(pnlTokenValue);

      newPosition.pnlData.displayedValue = `$${formatNumber(newPosition.pnlData.pnl_usd.amount)}`;
      newPosition.pnlData.displayedValueInSol = newPosition.pnlData.token_pnl
        .map((token) => `${formatNumber(token.amount)} ${token.token}`)
        .join(', ');

      newPosition.pnlData.percentageString = `(${formatPercentage(newPosition.pnlData.pnl_usd.bps / 10000)})`;
      newPosition.pnlData.percentageStringInSol = newPosition.pnlData.token_pnl
        .map((token) => `(${formatPercentage(token.bps / 10000)})`)
        .join(', ');
      // ----- END: PNL formatting -----

      // ----- START: YIELD formatting -----
      const yieldTokenValue = newPosition.yieldData.tokens.reduce(
        (sum, token) => sum + token.amount,
        0
      );
      const yieldUsdValue = newPosition.yieldData.usd.amount;
      newPosition.yieldData.yieldClass = getValueClass(yieldUsdValue);
      newPosition.yieldData.yieldClassInSol = getValueClass(yieldTokenValue);

      newPosition.yieldData.displayedValue = `$${formatNumber(newPosition.yieldData.usd.amount)}`;
      newPosition.yieldData.displayedValueInSol = newPosition.yieldData.tokens
        .map((token) => `${formatNumber(token.amount)} ${token.token}`)
        .join('<br />');
      // ----- END: YIELD formatting -----

      // ----- START: COMPOUNDED formatting -----
      const compoundedTokenValue = newPosition.compoundedData.tokens.reduce(
        (sum, token) => sum + token.amount,
        0
      );
      const compoundedUsdValue = newPosition.compoundedData.usd.amount;
      newPosition.compoundedData.compoundedClass =
        getValueClass(compoundedUsdValue);
      newPosition.compoundedData.compoundedClassInSol =
        getValueClass(compoundedTokenValue);

      newPosition.compoundedData.displayedValue = `$${formatNumber(newPosition.compoundedData.usd.amount)}`;
      newPosition.compoundedData.displayedValueInSol =
        newPosition.compoundedData.tokens
          .map((token) => `${formatNumber(token.amount)} ${token.token}`)
          .join('<br />');
      // ----- END: COMPOUNDED formatting -----

      return newPosition;
    });

    return {
      totalPnL: data.totalPnL,
      totalPnLInSol: data.totalPnLInSol,
      totalYield: data.totalYield,
      totalYieldInSol: data.totalYieldInSol,
      totalCompounded: data.totalCompounded,
      totalCompoundedInSol: data.totalCompoundedInSol,
      totalSize: data.totalSize,
      totalSizeInSol: data.totalSizeInSol,
      positions: formattedPositions,
      walletCount: typeof data.walletCount === 'number' ? data.walletCount : 0,
    };
  }, [data]);

  const positionsWithAge = usePositionAges(displayData.positions);

  // Only show donation footer if we have positions
  const showDonationFooter = displayData.positions.length > 0;

  return (
    <LoadingOverlay loading={loading}>
      <div className={styles.pnlContainer}>
        <div className={styles.controlsHeader}>
          <CurrencyToggle />
        </div>
        {positionsWithAge.length > 1 && (
          <div className={styles.cardRow}>
            <TotalPnLDisplay
              label="Total Size"
              totalValue={
                showInSol
                  ? displayData.totalSizeInSol
                  : `${formatNumber(displayData.totalSize, false)} $`
              }
            />

            <TotalPnLDisplay
              label="Total PnL"
              totalValue={
                showInSol ? displayData.totalPnLInSol : displayData.totalPnL
              }
            />

            <TotalPnLDisplay
              label="Total Yield"
              totalValue={
                showInSol ? displayData.totalYieldInSol : displayData.totalYield
              }
            />

            <TotalPnLDisplay
              label="Total Compounded"
              totalValue={
                showInSol
                  ? displayData.totalCompoundedInSol
                  : displayData.totalCompounded
              }
            />
          </div>
        )}

        <PositionsList
          positions={positionsWithAge}
          showWallet={displayData.walletCount > 1}
          historyEnabled={historyEnabled}
        />

        <DonationFooter visible={showDonationFooter} />
      </div>
    </LoadingOverlay>
  );
};
