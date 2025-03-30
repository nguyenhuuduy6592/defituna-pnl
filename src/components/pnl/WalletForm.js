import { useRef, useMemo, useCallback } from 'react';
import styles from './WalletForm.module.scss';
import { copyToClipboard, showNotification } from '../../utils/notifications';
import { isValidWalletAddress } from '../../utils/validation';
import SavedWalletsDropdown from './SavedWalletsDropdown';
import ActiveWalletsDisplay from './ActiveWalletsDisplay';

/**
 * Renders a form for entering and managing Solana wallet addresses.
 * Allows users to input a wallet, select from saved wallets via a dropdown,
 * activate/deactivate wallets, and submit the active wallets for data fetching.
 *
 * @param {object} props - The component props.
 * @param {string} props.wallet - The current value in the input field.
 * @param {function(string): void} props.onWalletChange - Callback when the input value changes.
 * @param {string[]} props.activeWallets - Array of currently active wallet addresses.
 * @param {function(string[]): void} props.setActiveWallets - Callback to set the active wallets array.
 * @param {function(string): void} props.toggleWalletActive - Callback to toggle the active state of a specific wallet.
 * @param {function(React.FormEvent<HTMLFormElement> | undefined): void} props.onSubmit - Callback triggered when the form is submitted with valid input.
 * @param {boolean} props.loading - Indicates if data is currently being fetched.
 * @param {number} props.countdown - Countdown timer until the next fetch is allowed.
 * @param {string[]} props.savedWallets - Array of saved wallet addresses for the dropdown.
 * @param {boolean} props.showDropdown - Controls the visibility of the saved wallets dropdown.
 * @param {function(boolean): void} props.setShowDropdown - Callback to set the dropdown visibility.
 * @param {function(string): void} props.onRemoveWallet - Callback to remove a wallet from the saved list.
 * @param {function(): void} props.onClearWallets - Callback to clear all saved wallets.
 */
export function WalletForm({
  wallet,
  onWalletChange,
  activeWallets,
  setActiveWallets,
  toggleWalletActive,
  onSubmit,
  loading,
  countdown,
  savedWallets,
  showDropdown,
  setShowDropdown,
  onRemoveWallet,
  onClearWallets
}) {
  const inputRef = useRef(null);
  
  // Filter out duplicate wallets
  const uniqueSavedWallets = useMemo(() => {
    // Use a Set to remove duplicates
    return [...new Set(savedWallets)];
  }, [savedWallets]);

  /**
   * Handles form submission.
   * Validates the input wallet address and updates the active wallets list.
   * Calls the onSubmit prop if validation passes.
   * @param {React.FormEvent<HTMLFormElement>} [e] - The form submission event.
   */
  const handleSubmit = useCallback((e) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedWallet = wallet.trim();

    // No input and no active wallets? Error.
    if (!trimmedWallet && activeWallets.length === 0) {
      showNotification('Please enter or select at least one wallet address', 'error');
      return;
    }

    // If there's input, validate it.
    if (trimmedWallet) {
        if (!isValidWalletAddress(trimmedWallet)) {
          showNotification('Invalid Solana wallet address format', 'error');
          return;
        }
        // Add the new valid wallet to active wallets
        // Use a Set to prevent duplicates if it was already active
        const newActiveWallets = [...new Set([...activeWallets, trimmedWallet])];
        // Only update if the list actually changed
        if (newActiveWallets.length > activeWallets.length) {
             setActiveWallets(newActiveWallets);
        }
    } else if (activeWallets.length === 0) {
        // Case: input is empty, and no wallets were previously active (e.g., user cleared input after activating some)
        // This case should have been caught by the first check, but added for robustness
         showNotification('Please enter or select at least one wallet address', 'error');
         return;
    }

    // If we have input OR pre-existing active wallets, proceed with submission
    onSubmit(e);

    // Clear input after successful add/submit
    onWalletChange('');
  }, [wallet, activeWallets, setActiveWallets, onSubmit]); // Add dependencies

  /**
   * Handles keydown events on wallet chip spans for accessibility.
   * Triggers copy action on Enter or Space.
   * @param {React.KeyboardEvent<HTMLSpanElement>} e - The keyboard event.
   * @param {string} walletAddress - The wallet address associated with the chip.
   */
   const handleChipKeyDown = useCallback((e, walletAddress) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent scrolling on spacebar
      copyToClipboard(walletAddress);
    }
  }, []); // No dependencies needed as copyToClipboard is static

  return (
    <div>
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={wallet}
            onChange={e => onWalletChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Enter wallet address"
            className={styles.input}
            disabled={loading}
            aria-label="Wallet address input"
            title="Enter a Solana wallet address"
          />
          
          {showDropdown && uniqueSavedWallets.length > 0 && (
            <SavedWalletsDropdown
              uniqueSavedWallets={uniqueSavedWallets}
              activeWallets={activeWallets}
              onWalletChange={onWalletChange}
              toggleWalletActive={toggleWalletActive}
              onRemoveWallet={onRemoveWallet}
              onClearWallets={onClearWallets}
            />
          )}
        </div>
        
        <button 
          type="submit" 
          className={styles.button} 
          disabled={loading || countdown > 0}
          aria-label={loading ? "Loading..." : countdown > 0 ? `Wait ${countdown} seconds` : "Fetch Data"}
          title={loading ? "Loading data..." : countdown > 0 ? `Wait ${countdown} seconds before next fetch` : "Fetch position data"}
        >
          {loading ? 'Loading...' : countdown > 0 ? `Wait ${countdown}s` : 'Fetch Data'}
        </button>
      </form>
      
      <ActiveWalletsDisplay 
        activeWallets={activeWallets}
        toggleWalletActive={toggleWalletActive}
        handleChipKeyDown={handleChipKeyDown}
      />
    </div>
  );
}