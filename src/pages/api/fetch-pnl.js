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
      state: d.state,
      yield: d.yield_a.usd + d.yield_b.usd,
      compounded: d.compounded_yield_a.usd + d.compounded_yield_b.usd,
      debt: d.loan_funds_b.usd - d.current_loan_b.usd,
      pnl: d.pnl.usd
    };
  }));
  return { totalPnL: positions.reduce((sum, p) => sum + p.pnl, 0), positions };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'Wallet address required' });
  try {
    const data = await fetchPnLData(walletAddress);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}