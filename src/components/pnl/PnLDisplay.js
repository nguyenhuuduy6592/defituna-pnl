import { PositionsList } from './PositionsList';
import styles from './PnLDisplay.module.scss';
import { showNotification } from '../../utils/notifications';

export const PnLDisplay = ({ data, isAggregated = false }) => {
  const formatValue = (val) => {
    if (Math.abs(val) < 0.01 && val !== 0) {
      return `${val >= 0 ? ' ' : '-'}${Math.abs(val).toFixed(6)}`.padStart(8);
    } else {
      return `${val >= 0 ? ' ' : '-'}${Math.abs(val).toFixed(2)}`.padStart(8);
    }
  };

  const getValueClass = (value) => {
    if (value > 0) return styles.positive;
    if (value < 0) return styles.negative;
    return styles.zero;
  };

  const handleCopyAddress = () => {
    const address = process.env.NEXT_PUBLIC_DONATION_WALLET;
    navigator.clipboard.writeText(address);
    showNotification('Wallet address copied to clipboard! 🐟');
  };

  const formatWalletAddress = (address) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className={styles.pnlContainer}>
      <div className={styles.pnlHeader}>
        <div className={styles.pnlGrid}>
          <div className={styles.pnlItem}>
            <div className={styles.label}>
              {isAggregated ? `Total PnL (${data.walletCount} Wallets)` : 'Total PnL'}
            </div>
            <div className={`${styles.value} ${getValueClass(data.totalPnL)}`}>
              ${formatValue(data.totalPnL)}
            </div>
          </div>
        </div>
      </div>
      
      <PositionsList 
        positions={data.positions} 
        formatValue={formatValue} 
        showWallet={isAggregated}
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