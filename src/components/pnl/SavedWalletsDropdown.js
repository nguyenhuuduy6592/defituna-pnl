import React from 'react';
import styles from './WalletForm.module.scss'; // Reuse styles for now
import { formatWalletAddress } from '../../utils';

/**
 * Renders the dropdown list of saved wallets.
 * Allows selecting a wallet, activating/deactivating, removing, and clearing.
 *
 * @param {object} props - The component props.
 * @param {string[]} props.uniqueSavedWallets - Array of unique saved wallet addresses.
 * @param {string[]} props.activeWallets - Array of currently active wallet addresses.
 * @param {function(string): void} props.onWalletChange - Callback to set the main input field value.
 * @param {function(string): void} props.toggleWalletActive - Callback to toggle the active state of a specific wallet.
 * @param {function(string): void} props.onRemoveWallet - Callback to remove a wallet from the saved list.
 * @param {function(): void} props.onClearWallets - Callback to clear all saved wallets.
 */
export function SavedWalletsDropdown({
  uniqueSavedWallets,
  activeWallets,
  onWalletChange,
  toggleWalletActive,
  onRemoveWallet,
  onClearWallets
}) {
  return (
    <div className={styles.dropdown} role="listbox">
      <div className={styles.savedWallets}>
        {uniqueSavedWallets.map((w, i) => (
          <div 
            key={i} 
            className={`${styles.dropdownItem} ${activeWallets.includes(w) ? styles.activeWallet : ''}`}
            role="option"
            aria-selected={activeWallets.includes(w)}
          >
            <span 
              onClick={() => onWalletChange(w)} 
              title="Click to select this wallet"
              // Consider adding onKeyDown for keyboard selection
            >
              {formatWalletAddress(w)}
            </span>
            <div className={styles.walletActions}>
              <button 
                type="button"
                className={styles.checkboxButton}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent dropdown from closing due to blur
                  toggleWalletActive(w);
                  // Keep the dropdown open after toggling
                  // onWalletChange(''); // Don't clear input on toggle from dropdown
                }}
                aria-label={activeWallets.includes(w) ? "Deactivate wallet" : "Activate wallet"}
                title={activeWallets.includes(w) ? "Deactivate this wallet" : "Activate this wallet"}
              >
                {activeWallets.includes(w) ? '✓' : '◯'}
              </button>
              <button 
                type="button"
                className={styles.removeButton}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent dropdown from closing
                  onRemoveWallet(w);
                }}
                aria-label="Remove wallet"
                title="Remove this wallet from saved list"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button 
          type="button"
          className={styles.clearButton} 
          onClick={(e) => {
            e.stopPropagation(); // Prevent dropdown from closing
            onClearWallets();
          }}
          aria-label="Clear all wallets"
          title="Remove all saved wallets"
        >
          Clear List
        </button>
      </div>
    </div>
  );
}

// Consider wrapping with React.memo if performance becomes an issue
// export default React.memo(SavedWalletsDropdown);
export default SavedWalletsDropdown; // Default export for easier dynamic import if needed 