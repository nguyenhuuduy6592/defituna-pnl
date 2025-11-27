import { useRef, useMemo, useCallback, memo } from 'react';
import styles from './WalletForm.module.scss';
import { copyToClipboard, showNotification } from '../../utils/notifications';
import { isValidWalletAddress } from '../../utils/validation';
import SavedWalletsDropdown from './SavedWalletsDropdown';
import ActiveWalletsDisplay from './ActiveWalletsDisplay';

/**
 * Submit button component that shows different states based on loading
 */
const SubmitButton = memo(({ loading }) => (
  <button 
    type="submit" 
    className={styles.button} 
    disabled={loading}
    aria-label={loading ? "Loading..." : "Fetch Data"}
    title={loading ? "Loading data..." : "Fetch position data"}
  >
    {loading ? 'Loading...' : 'Fetch Data'}
  </button>
));

SubmitButton.displayName = 'SubmitButton';

/**
 * Input field component with dropdown functionality
 */
const WalletInput = memo(({ 
  inputRef, 
  wallet, 
  onWalletChange, 
  setShowDropdown, 
  loading, 
  showDropdown,
  uniqueSavedWallets,
  activeWallets,
  toggleWalletActive,
  onRemoveWallet,
  onClearWallets
}) => (
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
));

WalletInput.displayName = 'WalletInput';

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
 * @param {string[]} props.savedWallets - Array of saved wallet addresses for the dropdown.
 * @param {boolean} props.showDropdown - Controls the visibility of the saved wallets dropdown.
 * @param {function(boolean): void} props.setShowDropdown - Callback to set the dropdown visibility.
 * @param {function(string): void} props.onRemoveWallet - Callback to remove a wallet from the saved list.
 * @param {function(): void} props.onClearWallets - Callback to clear all saved wallets.
 */
const WalletForm = memo(function WalletForm({
  wallet,
  onWalletChange,
  activeWallets,
  setActiveWallets,
  toggleWalletActive,
  onSubmit,
  loading,
  savedWallets,
  showDropdown,
  setShowDropdown,
  onRemoveWallet,
  onClearWallets
}) {
  const inputRef = useRef(null);
  
  // Filter out duplicate wallets
  const uniqueSavedWallets = useMemo(() => {
    return [...new Set(savedWallets)];
  }, [savedWallets]);

  /**
   * Handles form submission.
   * Validates the input wallet address and updates the active wallets list.
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
        const newActiveWallets = [...new Set([...activeWallets, trimmedWallet])];
        // Only update if the list actually changed
        if (newActiveWallets.length > activeWallets.length) {
             setActiveWallets(newActiveWallets);
        }
    }

    // If we have input OR pre-existing active wallets, proceed with submission
    onSubmit(e);

    // Clear input after successful add/submit
    onWalletChange('');
  }, [wallet, activeWallets, setActiveWallets, onSubmit, onWalletChange]);

  /**
   * Handles keydown events on wallet chip spans for accessibility.
   */
   const handleChipKeyDown = useCallback((e, walletAddress) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent scrolling on spacebar
      copyToClipboard(walletAddress);
    }
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <WalletInput
          inputRef={inputRef}
          wallet={wallet}
          onWalletChange={onWalletChange}
          setShowDropdown={setShowDropdown}
          loading={loading}
          showDropdown={showDropdown}
          uniqueSavedWallets={uniqueSavedWallets}
          activeWallets={activeWallets}
          toggleWalletActive={toggleWalletActive}
          onRemoveWallet={onRemoveWallet}
          onClearWallets={onClearWallets}
        />
        
        <SubmitButton loading={loading} />
      </form>
      
      <ActiveWalletsDisplay 
        activeWallets={activeWallets}
        toggleWalletActive={toggleWalletActive}
        handleChipKeyDown={handleChipKeyDown}
      />
    </div>
  );
});

export { WalletForm };