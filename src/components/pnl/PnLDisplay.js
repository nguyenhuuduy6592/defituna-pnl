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
 * Component for displaying PnL data and positions
 * @param {Object} props Component props
 * @param {Object} props.data Data containing PnL and positions information
 * @param {Object} props.positionTimestamps Timestamps for position creation
 * @param {boolean} props.historyEnabled Whether position history is enabled
 * @param {boolean} props.loading Whether data is currently loading
 * @returns {JSX.Element} Rendered component
 */
export const PnLDisplay = ({ data, positionTimestamps, historyEnabled, loading }) => {
  // Use provided data or default data
  const displayData = data || defaultData;
  
  // Ensure positions is an array
  const positions = Array.isArray(displayData.positions) ? displayData.positions : [];
  
  const positionsWithAge = usePositionAges(positions, positionTimestamps);

  return (
    <LoadingOverlay loading={loading}>
      <div className={styles.pnlContainer}>
        <TotalPnLDisplay 
          totalPnL={displayData.totalPnL || 0} 
          walletCount={displayData.walletCount || 0} 
        />
        
        <PositionsList 
          positions={positionsWithAge}
          showWallet={true}
          historyEnabled={historyEnabled}
        />

        <DonationFooter visible={displayData.positions.length > 0} />
      </div>
    </LoadingOverlay>
  );
};