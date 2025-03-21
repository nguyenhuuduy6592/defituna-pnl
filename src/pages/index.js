import { useState, useEffect, useRef } from 'react';

export async function getServerSideProps() {
  return { props: { data: null } };
}

export default ({ data: initData }) => {
  const [wallet, setWallet] = useState('');
  const [data, setData] = useState(initData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSol, setIsSol] = useState(true);
  const [savedWallets, setSavedWallets] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setSavedWallets(JSON.parse(localStorage.getItem('wallets')) || []);
    setCountdown(Number(localStorage.getItem('countdown')) || 0);
    setIsSol(localStorage.getItem('currency') !== 'usd');
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(c => {
          const next = c - 1;
          localStorage.setItem('countdown', next);
          if (next <= 0) localStorage.removeItem('countdown');
          return next;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  useEffect(() => {
    localStorage.setItem('currency', isSol ? 'sol' : 'usd');
  }, [isSol]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch('/api/fetch-pnl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch');
      setData(await res.json());
      setCountdown(15);
      localStorage.setItem('countdown', 15);
      if (wallet && !savedWallets.includes(wallet)) {
        const newWallets = [...savedWallets, wallet];
        setSavedWallets(newWallets);
        localStorage.setItem('wallets', JSON.stringify(newWallets));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeWallet = walletToRemove => {
    const newWallets = savedWallets.filter(w => w !== walletToRemove);
    setSavedWallets(newWallets);
    localStorage.setItem('wallets', JSON.stringify(newWallets));
  };

  const clearWallets = () => {
    setSavedWallets([]);
    localStorage.removeItem('wallets');
  };

  const formatValue = val => {
    const value = isSol ? val : val * data.solPrice;
    return `${value >= 0 ? ' ' : '-'}${Math.abs(value).toFixed(isSol ? 6 : 2)}`.padStart(isSol ? 10 : 8);
  };

  return (
    <div className="container">
      <title>Wallet PnL Viewer</title>
      <h1>Wallet PnL Viewer</h1>
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={wallet}
            onChange={e => setWallet(e.target.value)}
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
                  <span onClick={() => setWallet(w)}>{w}</span>
                  <span className="remove-icon" onClick={() => removeWallet(w)}>✕</span>
                </div>
              ))}
              <div className="dropdown-item clear-item" onClick={clearWallets}>Clear List</div>
            </div>
          )}
        </div>
        <button type="submit" className="button" disabled={loading || countdown > 0}>
          {loading ? 'Loading...' : countdown > 0 ? `Wait ${countdown}s` : 'Fetch Data'}
        </button>
      </form>
      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <div className="switch-container">
            <span>USD</span>
            <label className="switch">
              <input type="checkbox" checked={isSol} onChange={e => setIsSol(e.target.checked)} />
              <span className="slider"></span>
            </label>
            <span>SOL</span>
          </div>
          <h2>Total PnL: <span className={data.totalPnL > 0 ? 'positive' : data.totalPnL < 0 ? 'negative' : 'zero'}>
            {isSol ? `${formatValue(data.totalPnL)} SOL` : `$${formatValue(data.totalPnL)}`}
          </span></h2>
          <p>Current SOL Price: ${data.solPrice.toFixed(2)}</p>
          <hr />
          {data.positions.map((pos, i) => (
            <div key={i} className="position">
              <h3>Position {i + 1}: {pos.pair} (<span className={pos.state === 'open' ? 'positive' : 'negative'}>{pos.state}</span>)</h3>
              <table className="table">
                <thead><tr><th>Component</th><th>Amount {isSol ? '(SOL)' : '($)'}</th></tr></thead>
                <tbody>
                  <tr><td>Yield</td><td className={pos.yield > 0 ? 'positive' : pos.yield < 0 ? 'negative' : 'zero'}>{formatValue(pos.yield)}</td></tr>
                  <tr><td>Compounded</td><td className={pos.compounded > 0 ? 'positive' : pos.compounded < 0 ? 'negative' : 'zero'}>{formatValue(pos.compounded)}</td></tr>
                  <tr><td>Debt</td><td className={pos.debt > 0 ? 'positive' : pos.debt < 0 ? 'negative' : 'zero'}>{formatValue(pos.debt)}</td></tr>
                  <tr><td>PnL</td><td className={pos.pnl > 0 ? 'positive' : pos.pnl < 0 ? 'negative' : 'zero'}>{formatValue(pos.pnl)}</td></tr>
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </div>
  );
};