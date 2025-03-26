import { useRef } from 'react';

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
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          value={wallet}
          onChange={e => onWalletChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Enter wallet address"
          className="input"
          disabled={loading}
        />
        {showDropdown && savedWallets.length > 0 && (
          <div className="dropdown">
            {savedWallets.map((w, i) => (
              <div key={i} className="dropdown-item">
                <span onClick={() => onWalletChange(w)}>{w}</span>
                <span className="remove-icon" onClick={() => onRemoveWallet(w)}>✕</span>
              </div>
            ))}
            <div className="dropdown-item clear-item" onClick={onClearWallets}>Clear List</div>
          </div>
        )}
      </div>
      <button type="submit" className="button" disabled={loading || countdown > 0}>
        {loading ? 'Loading...' : countdown > 0 ? `Wait ${countdown}s` : 'Fetch Data'}
      </button>
    </form>
  );
};