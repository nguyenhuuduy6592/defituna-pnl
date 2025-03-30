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
 * @param {Object} props.positionTimestamps Timestamps for position creation
 * @param {boolean} props.historyEnabled Whether position history is enabled
 * @param {boolean} props.loading Whether data is currently loading
 * @returns {JSX.Element} Rendered component
 */
export const PnLDisplay = ({ 
  data, 
  positionTimestamps, 
  historyEnabled = false, 
  loading = false 
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
  
  // Get positions with age data included
  const positionsWithAge = usePositionAges(
    displayData.positions, 
    positionTimestamps
  );

  // Only show donation footer if we have positions
  const showDonationFooter = displayData.positions.length > 0;

  return (
    <LoadingOverlay loading={loading}>
      <div className={styles.pnlContainer}>
        <TotalPnLDisplay 
          totalPnL={displayData.totalPnL} 
          walletCount={displayData.walletCount} 
        />
        
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