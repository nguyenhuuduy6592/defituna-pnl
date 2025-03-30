import { useCallback } from 'react';
import styles from './DonationFooter.module.scss';
import { formatWalletAddress, copyToClipboard } from '../../utils';

/**
 * Component for displaying donation information with a copyable wallet address
 * 
 * @param {Object} props Component props
 * @param {boolean} props.visible Whether the donation footer should be visible
 * @returns {JSX.Element|null} Rendered component or null if not visible
 */
export const DonationFooter = ({ visible = false }) => {
  const donationWallet = process.env.NEXT_PUBLIC_DONATION_WALLET;
  
  const handleCopyAddress = useCallback(() => {
    copyToClipboard(donationWallet);
  }, [donationWallet]);
  
  if (!visible || !donationWallet) {
    return null;
  }

  const formattedAddress = formatWalletAddress(donationWallet);

  return (
    <div className={styles.donationFooter}>
      <div className={styles.title}>Support me</div>
      <div 
        className={styles.address}
        onClick={handleCopyAddress}
        title="Click to copy"
        role="button"
        tabIndex={0}
        aria-label="Copy donation wallet address"
      >
        {formattedAddress}
      </div>
      <div className={styles.description}>
        Your support helps keep the tool running and improving. Thank you! 🐟
      </div>
    </div>
  );
}; 