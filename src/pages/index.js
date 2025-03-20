import { useState, useEffect } from 'react';

export async function getServerSideProps() {
  return { props: { initialData: null } };
}

export default function Home({ initialData }) {
  const [wallet, setWallet] = useState('');
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const format = v => `${v >= 0 ? ' ' : '-'}${Math.abs(v).toFixed(2)}`.padStart(8);

  useEffect(() => {
    const storedCountdown = Number(localStorage.getItem('countdown')) || 0;
    setCountdown(storedCountdown);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(c => {
          const newCount = c - 1;
          localStorage.setItem('countdown', newCount);
          if (newCount <= 0) localStorage.removeItem('countdown');
          return newCount;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <title>Wallet PnL Viewer</title>
      <h1>Wallet PnL Viewer</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={wallet}
          onChange={e => setWallet(e.target.value)}
          placeholder="Enter wallet address"
          className="input"
          disabled={loading}
        />
        <button type="submit" className="button" disabled={loading || countdown > 0}>
          {loading ? 'Loading...' : countdown > 0 ? `Wait ${countdown}s` : 'Fetch Data'}
        </button>
      </form>

      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <h2>Total PnL: <span className={data.totalPnL > 0 ? 'positive' : data.totalPnL < 0 ? 'negative' : 'zero'}>${format(data.totalPnL)}</span></h2>
          <hr />
          {data.positions.map((pos, i) => (
            <div key={i} className="position">
              <h3>Position {i + 1}: {pos.pair} (<span className={pos.state === 'open' ? 'positive' : 'negative'}>{pos.state}</span>)</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Amount ($)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Yield</td><td className={pos.yield > 0 ? 'positive' : pos.yield < 0 ? 'negative' : 'zero'}>{format(pos.yield)}</td></tr>
                  <tr><td>Compounded</td><td className={pos.compounded > 0 ? 'positive' : pos.compounded < 0 ? 'negative' : 'zero'}>{format(pos.compounded)}</td></tr>
                  <tr><td>Debt</td><td className={pos.debt > 0 ? 'positive' : pos.debt < 0 ? 'negative' : 'zero'}>{format(pos.debt)}</td></tr>
                  <tr><td>PnL</td><td className={pos.pnl > 0 ? 'positive' : pos.pnl < 0 ? 'negative' : 'zero'}>{format(pos.pnl)}</td></tr>
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </div>
  );
}