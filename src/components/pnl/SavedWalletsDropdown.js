import React, { useCallback, memo } from 'react';
import styles from './WalletForm.module.scss'; // Reuse styles for now
import { formatWalletAddress } from '../../utils';

/**
 * Individual saved wallet item with selection and actions
 */
const SavedWalletItem = memo(({ 
  wallet, 
  isActive, 
  onSelect, 
  onToggleActive, 
  onRemove 
}) => {
  const formattedAddress = formatWalletAddress(wallet);
  
  // Handlers with stopPropagation to prevent dropdown from closing
  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    onToggleActive(wallet);
  }, [wallet, onToggleActive]);
  
  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    onRemove(wallet);
  }, [wallet, onRemove]);
  
  const handleSelect = useCallback(() => {
    onSelect(wallet);
  }, [wallet, onSelect]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(wallet);
    }
  }, [wallet, onSelect]);
  
  return (
    <div 
      className={`${styles.dropdownItem} ${isActive ? styles.activeWallet : ''}`}
      role="option"
      aria-selected={isActive}
    >
      <span 
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        title="Click to select this wallet"
      >
        {formattedAddress}
      </span>
      <div className={styles.walletActions}>
        <button 
          type="button"
          className={styles.checkboxButton}
          onClick={handleToggle}
          aria-label={isActive ? "Deactivate wallet" : "Activate wallet"}
          title={isActive ? "Deactivate this wallet" : "Activate this wallet"}
        >
          {isActive ? '✓' : '◯'}
        </button>
        <button 
          type="button"
          className={styles.removeButton}
          onClick={handleRemove}
          aria-label="Remove wallet"
          title="Remove this wallet from saved list"
        >
          ✕
        </button>
      </div>
    </div>
  );
});

SavedWalletItem.displayName = 'SavedWalletItem';

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
  const handleClearList = useCallback((e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    onClearWallets();
  }, [onClearWallets]);

  return (
    <div 
      className={styles.dropdown} 
      role="listbox"
      aria-label="Saved wallets"
    >
      <div className={styles.savedWallets}>
        {uniqueSavedWallets.map((wallet) => (
          <SavedWalletItem 
            key={wallet}
            wallet={wallet}
            isActive={activeWallets.includes(wallet)}
            onSelect={onWalletChange}
            onToggleActive={toggleWalletActive}
            onRemove={onRemoveWallet}
          />
        ))}
        
        {uniqueSavedWallets.length > 0 && (
          <button 
            type="button"
            className={styles.clearButton} 
            onClick={handleClearList}
            aria-label="Clear all wallets"
            title="Remove all saved wallets"
          >
            Clear List
          </button>
        )}
      </div>
    </div>
  );
}

// Keep this for backward compatibility
export default SavedWalletsDropdown; 