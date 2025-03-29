import { PositionsList } from './PositionsList';
import styles from './PnLDisplay.module.scss';
import { showNotification } from '../../utils/notifications';
import { formatValue, formatWalletAddress } from '../../utils/formatters';
import { getValueClass } from '../../utils/positionUtils';

export const PnLDisplay = ({ data }) => {
  const handleCopyAddress = () => {
    const address = process.env.NEXT_PUBLIC_DONATION_WALLET;
    navigator.clipboard.writeText(address);
    showNotification('Wallet address copied to clipboard! 🐟');
  };

  return (
    <div className={styles.pnlContainer}>
      <div className={styles.pnlHeader}>
        <div className={styles.pnlGrid}>
          <div className={styles.pnlItem}>
            <div className={styles.label}>
              Total PnL ({data.walletCount} Wallets)
            </div>
            <div className={`${styles.value} ${getValueClass(data.totalPnL)}`}>
              ${formatValue(data.totalPnL)}
            </div>
          </div>
        </div>
      </div>
      
      <PositionsList 
        positions={data.positions} 
        showWallet={true}
      />

      {/* Donation footer */}
      {data.positions.length > 0 && process.env.NEXT_PUBLIC_DONATION_WALLET && (
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
  );
};