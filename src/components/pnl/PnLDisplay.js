import { useMemo } from 'react';
import { PositionsList } from './PositionsList';
import { DonationFooter } from './DonationFooter';
import { TotalPnLDisplay } from './TotalPnLDisplay';
import styles from './PnLDisplay.module.scss';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { usePositionAges } from './hooks/usePositionAges';

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
  positionsHistory = []
}) => {
  // Use provided data or default data
  const displayData = useMemo(() => {
    if (!data) return defaultData;
    
    return {
      totalPnL: typeof data.totalPnL === 'number' ? data.totalPnL : 0,
      positions: Array.isArray(data.positions) ? data.positions : [],
      walletCount: typeof data.walletCount === 'number' ? data.walletCount : 0
    };
  }, [data]);
  
  // Get positions with age data included (using only opened_at from API)
  const positionsWithAge = usePositionAges(displayData.positions);

  // Calculate total yield from all positions
  const { totalYield, totalCompounded } = useMemo(() => {
    if (!Array.isArray(displayData.positions) || displayData.positions.length === 0) {
      return { totalYield: 0, totalCompounded: 0 };
    }
    
    return displayData.positions.reduce((acc, position) => {
      // Add position yield if available
      if (position?.yield?.usd) {
        acc.totalYield += position.yield.usd;
      }
      
      // Add compounded amount if available
      if (position?.compounded?.usd) {
        acc.totalCompounded += position.compounded.usd;
      }
      
      return acc;
    }, { totalYield: 0, totalCompounded: 0 });
  }, [displayData.positions]);

  // Only show donation footer if we have positions
  const showDonationFooter = displayData.positions.length > 0;

  return (
    <LoadingOverlay loading={loading}>
      <div className={styles.pnlContainer}>
        <div className={styles.cardRow}>
          <TotalPnLDisplay
            label="Total PnL"
            totalValue={displayData.totalPnL} />
          
          <TotalPnLDisplay
            label="Total Yield"
            totalValue={totalYield} />
        
          <TotalPnLDisplay
            label="Total Compounded"
            totalValue={totalCompounded} />
        </div>

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