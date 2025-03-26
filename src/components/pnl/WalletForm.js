import { useRef } from 'react';
import styles from './WalletForm.module.scss';

export const WalletForm = ({
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
}) => {
  const inputRef = useRef(null);

  return (
    <form onSubmit={onSubmit}>
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
};