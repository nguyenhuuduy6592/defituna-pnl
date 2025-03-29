import { processTunaPosition } from './formulas.js';

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
  if (!response.ok) {
    throw new Error(`Failed to fetch pool data: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

export async function fetchMarketData() {
  const response = await fetch(`${process.env.DEFITUNA_API_URL}/markets`);
  if (!response.ok) {
    throw new Error(`Failed to fetch market data: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

export async function fetchTokenData(mintAddress) {
  try {
    const response = await fetch(`${process.env.DEFITUNA_API_URL}/mints/${mintAddress}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch token data: ${response.status} ${response.statusText}`);
    }
    const { data } = await response.json();
    return {
      symbol: data.symbol,
      mint: data.mint,
      decimals: data.decimals
    };
  } catch (error) {
    console.error(`Error fetching token data for ${mintAddress}:`, error);
    return {
      symbol: `${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`,
      mint: mintAddress,
      decimals: 9 // Default to 9 decimals if unknown
    };
  }
}

export async function processPositionsData(positionsData, ages) {
  try {
    // 1. Fetch market data (shared among all positions)
    const marketData = await fetchMarketData();
    
    // 2. Get unique pools from positions
    const uniquePools = [...new Set(positionsData.map(d => d.pool))];
    
    // 3. Fetch pool data for each unique pool
    const poolsData = {};
    for (const poolAddress of uniquePools) {
      const poolResponse = await fetchPoolData(poolAddress);
      poolsData[poolAddress] = poolResponse;
    }
    
    // 4. Get unique token mints from all pools
    const uniqueMints = new Set();
    Object.values(poolsData).forEach(poolResponse => {
      const pool = poolResponse.data;
      uniqueMints.add(pool.token_a_mint);
      uniqueMints.add(pool.token_b_mint);
    });
    
    // 5. Fetch token data for each unique mint
    const tokensData = {};
    for (const mintAddress of uniqueMints) {
      const tokenData = await fetchTokenData(mintAddress);
      tokensData[mintAddress] = tokenData;
    }
    
    // 6. Process each position with all the gathered data
    return positionsData.map((position, index) => {
      const poolAddress = position.pool;
      const poolData = poolsData[poolAddress];
      const pool = poolData.data;
      
      const tokenA = tokensData[pool.token_a_mint];
      const tokenB = tokensData[pool.token_b_mint];
      
      if (!tokenA || !tokenB) {
        console.error('Missing token data for position:', position);
        return null;
      }
      
      // Process position using the main formula
      const processedPosition = processTunaPosition(
        { data: position },
        poolData,
        marketData,
        tokenA,
        tokenB
      );
      
      // Add additional fields
      return {
        ...processedPosition,
        pair: `${tokenA.symbol}/${tokenB.symbol}`,
        walletAddress: position.address,
        age: ages[index],
        state: position.state
      };
    }).filter(Boolean); // Remove any null entries from failed processing
  } catch (error) {
    console.error('Error processing positions data:', error);
    throw error;
  }
}