// pages/index.js
import { useState } from 'react';

async function fetchPnLData(walletAddress) {
  const baseUrl = "https://api.defituna.com/api/v1";
  const { data } = await fetch(`${baseUrl}/users/${walletAddress}/tuna-positions`).then(r => r.json());
  const pools = {}, tokens = {};
  const positions = await Promise.all(data.map(async d => {
    pools[d.pool] ??= await fetch(`${baseUrl}/pools/${d.pool}`).then(r => r.json()).then(r => r.data);
    const { token_a_mint: a, token_b_mint: b } = pools[d.pool];
    tokens[a] ??= await fetch(`${baseUrl}/mints/${a}`).then(r => r.json()).then(r => r.data.symbol);
    tokens[b] ??= await fetch(`${baseUrl}/mints/${b}`).then(r => r.json()).then(r => r.data.symbol);
    return {
      pair: `${tokens[a]}/${tokens[b]}`,
      yield: d.yield_a.usd + d.yield_b.usd,
      compounded: d.compounded_yield_a.usd + d.compounded_yield_b.usd,
      debt: d.loan_funds_b.usd - d.current_loan_b.usd,
      pnl: d.pnl.usd
    };
  }));
  return { totalPnL: positions.reduce((sum, p) => sum + p.pnl, 0), positions };
}

export async function getServerSideProps({ query }) {
  const walletAddress = query.wallet || '';
  if (!walletAddress) return { props: { data: null } };
  try {
    const data = await fetchPnLData(walletAddress);
    return { props: { data } };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { props: { data: null, error: 'Failed to fetch data' } };
  }
}

export default function Home({ data, error }) {
  const [wallet, setWallet] = useState('');
  const format = v => (
    <span style={{ color: v > 0 ? 'green' : v < 0 ? 'red' : 'blue' }}>
      {`${v >= 0 ? ' ' : '-'}${Math.abs(v).toFixed(2)}`.padStart(8)}
    </span>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = `/?wallet=${encodeURIComponent(wallet)}`;
  };

  return (
    <div className="container">
      <h1>Wallet PnL Viewer</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={wallet}
          onChange={e => setWallet(e.target.value)}
          placeholder="Enter wallet address"
          className="input"
        />
        <button type="submit" className="button">Fetch Data</button>
      </form>

      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <h2>Total PnL: ${format(data.totalPnL)}</h2>
          <hr />
          {data.positions.map((pos, i) => (
            <div key={i} className="position">
              <h3>Position {i + 1}: {pos.pair}</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Amount ($)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Yield</td><td>{format(pos.yield)}</td></tr>
                  <tr><td>Compounded</td><td>{format(pos.compounded)}</td></tr>
                  <tr><td>Debt</td><td>{format(pos.debt)}</td></tr>
                  <tr><td>PnL</td><td>{format(pos.pnl)}</td></tr>
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </div>
  );
}