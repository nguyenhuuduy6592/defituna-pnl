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
  loading = false
}) => {
  const { showInSol } = useDisplayCurrency();
  // Use provided data or default data
  const displayData = useMemo(() => {
    if (!data) return defaultData;
    
    const positions = Array.isArray(data.positions) ? data.positions : [];

    // for each position, add the pnlClass, displayedValue, and percentageString
    for (const position of positions) {
      // ----- START: PNL formatting -----
      const pnlTokenValue = position.pnlData.token_pnl.reduce((sum, token) => sum + token.amount, 0);
      const pnlUsdValue = position.pnlData.pnl_usd.amount;
      position.pnlData.pnlClass = getValueClass(pnlUsdValue);
      position.pnlData.pnlClassInSol = getValueClass(pnlTokenValue);
    
      position.pnlData.displayedValue = `$${formatNumber(position.pnlData.pnl_usd.amount)}`;
      position.pnlData.displayedValueInSol = position.pnlData.token_pnl.map(token => `${formatNumber(token.amount)} ${token.token}`).join(', ');
    
      position.pnlData.percentageString = `(${formatPercentage(position.pnlData.pnl_usd.bps / 10000)})`;
      position.pnlData.percentageStringInSol = position.pnlData.token_pnl.map(token => `(${formatPercentage(token.bps / 10000)})`).join(', ');
      // ----- END: PNL formatting -----

      // ----- START: YIELD formatting -----
      const yieldTokenValue = position.yieldData.tokens.reduce((sum, token) => sum + token.amount, 0);
      const yieldUsdValue = position.yieldData.usd.amount;
      position.yieldData.yieldClass = getValueClass(yieldUsdValue);
      position.yieldData.yieldClassInSol = getValueClass(yieldTokenValue);

      position.yieldData.displayedValue = `$${formatNumber(position.yieldData.usd.amount)}`;
      position.yieldData.displayedValueInSol = position.yieldData.tokens.map(token => `${formatNumber(token.amount)} ${token.token}`).join('<br />');
      // ----- END: YIELD formatting -----
    }
  
    return {
      totalPnL: data.totalPnL,
      totalPnLInSol: data.totalPnLInSol,
      totalYield: data.totalYield,
      totalYieldInSol: data.totalYieldInSol,
      totalCompounded: data.totalCompounded,
      totalCompoundedInSol: data.totalCompoundedInSol,
      positions,
      walletCount: typeof data.walletCount === 'number' ? data.walletCount : 0
    };
  }, [data, showInSol]);

  const positionsWithAge = usePositionAges(displayData.positions);
  
  // Only show donation footer if we have positions
  const showDonationFooter = displayData.positions.length > 0;

  return (
    <LoadingOverlay loading={loading}>
      <div className={styles.pnlContainer}>
        <div className={styles.controlsHeader}>
          <CurrencyToggle />
        </div>
        {positionsWithAge.length > 1 && 
          <div className={styles.cardRow}>
            <TotalPnLDisplay
              label="Total PnL"
              totalValue={showInSol ? displayData.totalPnLInSol : displayData.totalPnL} />
            
            <TotalPnLDisplay
              label="Total Yield"
              totalValue={showInSol ? displayData.totalYieldInSol : displayData.totalYield} />
          
            <TotalPnLDisplay
              label="Total Compounded"
              totalValue={showInSol ? displayData.totalCompoundedInSol : displayData.totalCompounded} />
          </div>
        }

        <PositionsList 
          positions={positionsWithAge}
          showWallet={true}
          historyEnabled={historyEnabled}
        />

        <DonationFooter visible={showDonationFooter} />
      </div>
    </LoadingOverlay>
  );
};