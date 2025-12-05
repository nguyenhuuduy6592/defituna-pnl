import { useCallback, memo } from 'react';
import styles from './WalletForm.module.scss';
import { formatWalletAddress, copyToClipboard } from '../../utils';

/**
 * Individual wallet chip component with copy and remove functionality
 */
const WalletChip = memo(({ wallet, onRemove, onKeyDown }) => {
  const formattedAddress = formatWalletAddress(wallet);

  const handleCopy = useCallback(() => {
    copyToClipboard(wallet);
  }, [wallet]);

  return (
    <div className={styles.walletChip}>
      <span
        title="Copy to clipboard"
        onClick={handleCopy}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => onKeyDown(e, wallet)}
        aria-label={`Copy wallet ${formattedAddress}`}
      >
        {formattedAddress}
      </span>
      <button
        type="button"
        className={styles.removeChip}
        onClick={() => onRemove(wallet)}
        aria-label={`Deactivate wallet ${formattedAddress}`}
        title="Deactivate this wallet"
      >
        ✕
      </button>
    </div>
  );
});

WalletChip.displayName = 'WalletChip';

/**
 * Renders the section displaying currently active wallets as chips.
 * Allows copying addresses and deactivating wallets.
 *
 * @param {object} props - The component props.
 * @param {string[]} props.activeWallets - Array of currently active wallet addresses.
 * @param {function(string): void} props.toggleWalletActive - Callback to toggle the active state of a specific wallet.
 * @param {function(React.KeyboardEvent<HTMLSpanElement>, string): void} props.handleChipKeyDown - Callback for keydown events on chips for accessibility.
 */
export function ActiveWalletsDisplay({
  activeWallets,
  toggleWalletActive,
  handleChipKeyDown,
}) {
  if (!activeWallets || activeWallets.length === 0) {
    return null; // Don't render anything if no active wallets
  }

  return (
    <div className={styles.activeWallets}>
      <h3>Active Wallets ({activeWallets.length})</h3>
      <div className={styles.walletChips}>
        {activeWallets.map((wallet, index) => (
          <WalletChip
            key={wallet || index}
            wallet={wallet}
            onRemove={toggleWalletActive}
            onKeyDown={handleChipKeyDown}
          />
        ))}
      </div>
    </div>
  );
}

// For backwards compatibility
export default ActiveWalletsDisplay;