import { PositionsList } from './PositionsList';
import styles from './PnLDisplay.module.scss';
import { showNotification } from '../../utils/notifications';
import { formatValue, formatWalletAddress } from '../../utils/formatters';
import { getValueClass } from '../../utils/positionUtils';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { useMemo, useState, useEffect } from 'react';

// Default structure when data is not yet available
const defaultData = {
  totalPnL: 0,
  positions: [],
  walletCount: 0,
};

export const PnLDisplay = ({ data, positionTimestamps, historyEnabled, loading }) => {
  const handleCopyAddress = () => {
    const address = process.env.NEXT_PUBLIC_DONATION_WALLET;
    navigator.clipboard.writeText(address);
    showNotification('Wallet address copied to clipboard! 🐟');
  };

  // Use provided data or default data
  const displayData = data || defaultData;
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update current time every second for live age calculation
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Merge ages into positions, calculating duration on the fly
  const positionsWithAge = useMemo(() => {
    if (!displayData.positions) return [];
    const nowSeconds = Math.floor(currentTime / 1000);
    return displayData.positions.map(pos => {
      const creationTimestamp = positionTimestamps[pos.positionAddress];
      let ageSeconds = null; 
      if (typeof creationTimestamp === 'number' && creationTimestamp > 0) {
        ageSeconds = nowSeconds - creationTimestamp;
      }
      return {
        ...pos,
        age: ageSeconds // Pass calculated duration (or null)
      };
    });
  }, [displayData.positions, positionTimestamps, currentTime]);

  return (
    <LoadingOverlay loading={loading}>
      <div className={styles.pnlContainer}>
        <div className={styles.pnlHeader}>
          <div className={styles.pnlGrid}>
            <div className={styles.pnlItem}>
              <div className={styles.label}>
                Total PnL ({displayData.walletCount} Wallets)
              </div>
              <div className={`${styles.value} ${styles[getValueClass(displayData.totalPnL)]}`}>
                ${formatValue(displayData.totalPnL)}
              </div>
            </div>
          </div>
        </div>
        
        <PositionsList 
          positions={positionsWithAge}
          showWallet={true}
          historyEnabled={historyEnabled}
        />

        {/* Donation footer */}
        {displayData.positions.length > 0 && process.env.NEXT_PUBLIC_DONATION_WALLET && (
          <div className={styles.donationFooter}>
            <div className={styles.title}>Support me</div>
            <div 
              className={styles.address} 
              onClick={handleCopyAddress}
              title="Click to copy"
              role="button"
              aria-label="Copy donation wallet address"
            >
              {formatWalletAddress(process.env.NEXT_PUBLIC_DONATION_WALLET)}
            </div>
            <div className={styles.description}>
              Your support helps keep the tool running and improving. Thank you! 🐟
            </div>
          </div>
        )}
      </div>
    </LoadingOverlay>
  );
};