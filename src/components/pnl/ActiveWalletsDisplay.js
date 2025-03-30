import React from 'react';
import styles from './WalletForm.module.scss';
import { formatWalletAddress, copyToClipboard } from '../../utils';

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
  handleChipKeyDown
}) {
  if (!activeWallets || activeWallets.length === 0) {
    return null; // Don't render anything if no active wallets
  }

  return (
    <div className={styles.activeWallets}>
      <h3>Active Wallets ({activeWallets.length})</h3>
      <div className={styles.walletChips}>
        {activeWallets.map((w, i) => (
          <div key={i} className={styles.walletChip}>
            <span 
              title="Copy to clipboard"
              onClick={() => copyToClipboard(w)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleChipKeyDown(e, w)}
            >
              {formatWalletAddress(w)}
            </span>
            <button 
              type="button"
              className={styles.removeChip}
              onClick={() => toggleWalletActive(w)}
              aria-label="Deactivate wallet"
              title="Deactivate this wallet"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Consider wrapping with React.memo if performance becomes an issue
// export default React.memo(ActiveWalletsDisplay);
export default ActiveWalletsDisplay; // Default export 