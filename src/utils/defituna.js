export async function fetchSolPrice() {
  const solPriceData = await fetch(`${process.env.DEFITUNA_API_URL}/oracle-prices/So11111111111111111111111111111111111111112`)
    .then(r => r.json())
    .catch(error => {
      console.error('Error fetching SOL price:', error);
      throw new Error('Failed to fetch SOL price');
    });

  return parseFloat(solPriceData.data.price) / Math.pow(10, solPriceData.data.decimals);
}

export async function fetchPositions(wallet) {
  const response = await fetch(`${process.env.DEFITUNA_API_URL}/users/${wallet}/tuna-positions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch positions: ${response.status} ${response.statusText}`);
  }
  
  const { data } = await response.json();
  if (!data || !Array.isArray(data)) {
    console.error('Invalid positions data received:', data);
    throw new Error('Invalid positions data received from API');
  }
  return data;
}

export async function fetchPoolData(poolAddress) {
  const response = await fetch(`${process.env.DEFITUNA_API_URL}/pools/${poolAddress}`);
  return (await response.json()).data;
}

export async function fetchTokenData(mintAddress) {
  try {
    const response = await fetch(`${process.env.DEFITUNA_API_URL}/mints/${mintAddress}`);
    const { data } = await response.json();
    return {
      success: true,
      symbol: data.symbol,
      mint: data.mint
    };
  } catch (error) {
    return {
      success: false,
      symbol: `${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`,
      mint: mintAddress
    };
  }
}

export async function processPositionsData(positionsData, ages) {
  const pools = {}, tokens = {};
  
  // Preload all pools data in parallel
  const uniquePools = [...new Set(positionsData.map(d => d.pool))];
  const poolsData = await Promise.all(
    uniquePools.map(pool => fetchPoolData(pool))
  );
  
  // Map pool addresses to their data
  poolsData.forEach(poolData => {
    pools[poolData.address] = poolData;
  });
  
  // Get all unique token mints
  const uniqueMints = new Set();
  Object.values(pools).forEach(pool => {
    uniqueMints.add(pool.token_a_mint);
    uniqueMints.add(pool.token_b_mint);
  });
  
  // Fetch all token data in parallel
  const tokenResponses = await Promise.all(
    Array.from(uniqueMints).map(mint => fetchTokenData(mint))
  );
  
  tokenResponses.forEach(response => {
    tokens[response.mint] = response.symbol;
  });
  
  // Process positions with loaded data
  return positionsData.map((d, index) => {
    const pool = pools[d.pool];
    const { token_a_mint: a, token_b_mint: b } = pool;
    
    const tokenA = tokens[a] || `${a.slice(0, 4)}...${a.slice(-4)}`;
    const tokenB = tokens[b] || `${b.slice(0, 4)}...${b.slice(-4)}`;
    
    return {
      pair: `${tokenA}/${tokenB}`,
      state: d.state,
      age: ages[index],
      yield: d.yield_a.usd + d.yield_b.usd,
      compounded: d.compounded_yield_a.usd + d.compounded_yield_b.usd,
      debt: d.loan_funds_b.usd - d.current_loan_b.usd,
      pnl: d.pnl.usd
    };
  });
}