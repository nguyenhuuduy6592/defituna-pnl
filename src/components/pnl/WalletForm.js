import { useRef, useState } from 'react';
import styles from './WalletForm.module.scss';

export default function WalletForm({
  wallet,
  onWalletChange,
  activeWallets,
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
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }
    
    // Clear previous error
    setError('');

    // Check if we have active wallets
    if (activeWallets.length === 0) {
      if (!wallet.trim()) {
        setError('Please enter or select at least one wallet address');
        return;
      }
      
      // Basic validation for Solana address (base58, 32-44 chars)
      const trimmedWallet = wallet.trim();
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmedWallet)) {
        setError('Invalid Solana wallet address format');
        return;
      }
      
      // Add the current wallet as active if none are active
      toggleWalletActive(trimmedWallet);
    }

    onSubmit(e);
  };

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
          {error && <div className={styles.error}>{error}</div>}
          
          {showDropdown && savedWallets.length > 0 && (
            <div className={styles.dropdown}>
              <div className={styles.savedWallets}>
                {savedWallets.map((w, i) => (
                  <div key={i} className={`${styles.dropdownItem} ${activeWallets.includes(w) ? styles.activeWallet : ''}`}>
                    <span onClick={() => onWalletChange(w)} title="Click to select this wallet">{w}</span>
                    <div className={styles.walletActions}>
                      <button 
                        type="button"
                        className={styles.checkboxButton}
                        onClick={() => toggleWalletActive(w)}
                        aria-label={activeWallets.includes(w) ? "Deactivate wallet" : "Activate wallet"}
                        title={activeWallets.includes(w) ? "Deactivate this wallet" : "Activate this wallet"}
                      >
                        {activeWallets.includes(w) ? '✓' : '◯'}
                      </button>
                      <button 
                        type="button"
                        className={styles.removeButton}
                        onClick={() => onRemoveWallet(w)}
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
                  onClick={onClearWallets}
                  aria-label="Clear all wallets"
                  title="Remove all saved wallets"
                >
                  Clear List
                </button>
              </div>
            </div>
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
      
      {activeWallets.length > 0 && (
        <div className={styles.activeWallets}>
          <h3>Active Wallets ({activeWallets.length})</h3>
          <div className={styles.walletChips}>
            {activeWallets.map((w, i) => (
              <div key={i} className={styles.walletChip}>
                <span title={w}>{w.slice(0, 6)}...{w.slice(-4)}</span>
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
      )}
    </div>
  );
}