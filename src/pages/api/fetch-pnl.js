async function fetchPnL(wallet) {
  const baseUrl = "https://api.defituna.com/api/v1";
  
  // Use DeFi Tuna's oracle price endpoint instead of CoinGecko
  const solPriceData = await fetch(`${baseUrl}/oracle-prices/So11111111111111111111111111111111111111112`)
    .then(r => r.json());
  const solPrice = parseFloat(solPriceData.data.price) / Math.pow(10, solPriceData.data.decimals);
  
  const { data } = await fetch(`${baseUrl}/users/${wallet}/tuna-positions`).then(r => r.json());
  const pools = {}, tokens = {};
  
  // Preload all pools data in parallel instead of sequentially
  const uniquePools = [...new Set(data.map(d => d.pool))];
  const poolsData = await Promise.all(
    uniquePools.map(pool => fetch(`${baseUrl}/pools/${pool}`).then(r => r.json()))
  );
  
  // Map pool addresses to their data
  poolsData.forEach(response => {
    pools[response.data.address] = response.data;
  });
  
  // Get all unique token mints
  const uniqueMints = new Set();
  Object.values(pools).forEach(pool => {
    uniqueMints.add(pool.token_a_mint);
    uniqueMints.add(pool.token_b_mint);
  });
  
  // Fetch all token data in parallel
  const tokenPromises = Array.from(uniqueMints).map(mint => 
    fetch(`${baseUrl}/mints/${mint}`).then(r => r.json())
  );
  
  const tokenResponses = await Promise.all(tokenPromises);
  tokenResponses.forEach(response => {
    tokens[response.data.address] = response.data.symbol;
  });
  
  // Process positions with already loaded data
  const positions = data.map(d => {
    const pool = pools[d.pool];
    const { token_a_mint: a, token_b_mint: b } = pool;
    
    return {
      pair: `${tokens[a]}/${tokens[b]}`,
      state: d.state,
      yield: (d.yield_a.usd + d.yield_b.usd) / solPrice,
      compounded: (d.compounded_yield_a.usd + d.compounded_yield_b.usd) / solPrice,
      debt: (d.loan_funds_b.usd - d.current_loan_b.usd) / solPrice,
      pnl: d.pnl.usd / solPrice
    };
  });
  
  return { 
    totalPnL: positions.reduce((sum, p) => sum + p.pnl, 0), 
    positions, 
    solPrice 
  };
}

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'Wallet address required' });
  try {
    res.status(200).json(await fetchPnL(walletAddress));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};