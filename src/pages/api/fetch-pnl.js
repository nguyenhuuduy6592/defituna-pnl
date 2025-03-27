import { getPositionAge } from '../../utils/solscan';
import { getTransactionAges } from '../../utils/solanaweb3';

async function getAges(positions) {
  if (!positions || !Array.isArray(positions) || positions.length === 0) {
    console.error('Invalid positions array:', positions);
    return [];
  }

  try {
    // Validate positions have the required address property
    const validPositions = positions.filter(p => p && p.address);
    if (validPositions.length === 0) {
      console.error('No valid positions found with address property');
      return positions.map(() => 'Unknown');
    }

    // Try Solana RPC first with batch processing
    const ages = await getTransactionAges(validPositions.map(p => p.address));
    
    // For any positions that returned 'Unknown', fall back to solscan
    const results = await Promise.all(
      positions.map(async (pos) => {
        if (!pos || !pos.address) return 'Unknown';
        const age = ages.get(pos.address);
        if (age === 'Unknown') {
          return getPositionAge(pos.address);
        }
        return age;
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error getting ages:', error);
    // Final fallback to solscan for all positions
    return Promise.all(
      positions.map(pos => pos && pos.address ? getPositionAge(pos.address) : 'Unknown')
    );
  }
}

async function fetchPnL(wallet) {
  if (!wallet) {
    throw new Error('Wallet address is required');
  }

  const baseUrl = "https://api.defituna.com/api/v1";
  
  // Use DeFi Tuna's oracle price endpoint instead of CoinGecko
  const solPriceData = await fetch(`${baseUrl}/oracle-prices/So11111111111111111111111111111111111111112`)
    .then(r => r.json())
    .catch(error => {
      console.error('Error fetching SOL price:', error);
      throw new Error('Failed to fetch SOL price');
    });

  const solPrice = parseFloat(solPriceData.data.price) / Math.pow(10, solPriceData.data.decimals);
  
  const response = await fetch(`${baseUrl}/users/${wallet}/tuna-positions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch positions: ${response.status} ${response.statusText}`);
  }
  
  const { data } = await response.json();
  if (!data || !Array.isArray(data)) {
    console.error('Invalid positions data received:', data);
    throw new Error('Invalid positions data received from API');
  }

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
  
  // Fetch all token data in parallel with error handling
  const tokenPromises = Array.from(uniqueMints).map(mint => 
    fetch(`${baseUrl}/mints/${mint}`)
      .then(r => r.json())
      .then(response => ({
        success: true,
        data: response.data
      }))
      .catch(error => ({
        success: false,
        mint
      }))
  );
  
  const tokenResponses = await Promise.all(tokenPromises);
  
  tokenResponses.forEach(response => {
    if (response.success && response.data) {
      tokens[response.data.mint] = response.data.symbol;
    } else if (!response.success) {
      const mint = response.mint;
      tokens[mint] = `${mint.slice(0, 4)}...${mint.slice(-4)}`;
    }
  });
  
  // Fetch position ages using the new batched method
  const positionAges = await getAges(data);
  
  // Process positions with already loaded data
  const positions = data.map((d, index) => {
    const pool = pools[d.pool];
    const { token_a_mint: a, token_b_mint: b } = pool;
    
    const tokenA = tokens[a] || `${a.slice(0, 4)}...${a.slice(-4)}`;
    const tokenB = tokens[b] || `${b.slice(0, 4)}...${b.slice(-4)}`;
    
    return {
      pair: `${tokenA}/${tokenB}`,
      state: d.state,
      age: positionAges[index],
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress } = req.body;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  // Validate wallet address format
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress.trim())) {
    return res.status(400).json({ error: 'Invalid Solana wallet address format' });
  }

  try {
    const result = await fetchPnL(walletAddress.trim());
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in fetch-pnl:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};