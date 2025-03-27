import { useRef, useState } from 'react';
import styles from './WalletForm.module.scss';

export default function WalletForm({
  wallet,
  onWalletChange,
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

    // Basic validation for Solana address (base58, 32-44 chars)
    const trimmedWallet = wallet.trim();
    if (!trimmedWallet) {
      setError('Please enter a wallet address');
      return;
    }
    
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmedWallet)) {
      setError('Invalid Solana wallet address format');
      return;
    }

    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit}>
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
        />
        {error && <div className={styles.error}>{error}</div>}
        {showDropdown && savedWallets.length > 0 && (
          <div className={styles.dropdown}>
            {savedWallets.map((w, i) => (
              <div key={i} className={styles.dropdownItem}>
                <span onClick={() => onWalletChange(w)}>{w}</span>
                <span className={styles.removeIcon} onClick={() => onRemoveWallet(w)}>✕</span>
              </div>
            ))}
            <div className={styles.clearItem} onClick={onClearWallets}>Clear List</div>
          </div>
        )}
      </div>
      <button type="submit" className={styles.button} disabled={loading || countdown > 0}>
        {loading ? 'Loading...' : countdown > 0 ? `Wait ${countdown}s` : 'Fetch Data'}
      </button>
    </form>
  );
}