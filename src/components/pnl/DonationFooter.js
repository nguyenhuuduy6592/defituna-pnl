import styles from './DonationFooter.module.scss';
import { formatWalletAddress, copyToClipboard } from '../../utils';

/**
 * Component for displaying donation information
 * @param {Object} props Component props
 * @param {boolean} props.visible Whether the donation footer should be visible
 * @returns {JSX.Element|null} Rendered component or null if not visible
 */
export const DonationFooter = ({ visible = false }) => {
  const donationWallet = process.env.NEXT_PUBLIC_DONATION_WALLET;
  
  if (!visible || !donationWallet) {
    return null;
  }

  return (
    <div className={styles.donationFooter}>
      <div className={styles.title}>Support me</div>
      <div 
        className={styles.address}
        onClick={() => copyToClipboard(donationWallet)}
        title="Click to copy"
        role="button"
        aria-label="Copy donation wallet address"
      >
        {formatWalletAddress(donationWallet)}
      </div>
      <div className={styles.description}>
        Your support helps keep the tool running and improving. Thank you! 🐟
      </div>
    </div>
  );
}; 