import { fetchPoolData, fetchAllPools } from '../../utils/defituna';
import { decodeValue } from '../../utils/positionUtils';

const DEFITUNA_API = process.env.DEFITUNA_API_URL;

// Constants for value encoding/decoding
const USD_MULTIPLIER = 100; // Convert dollars to cents (2 decimal places)

/**
 * Calculates the Fee APR for a pool based on fees and TVL
 * @param {Object} pool - Pool data object
 * @param {string} timeframe - Timeframe for APR calculation ('24h', '7d', '30d')
 * @returns {number} Fee APR as a percentage
 */
function calculateFeeAPR(pool, timeframe) {
  try {
    // Get fees and TVL for the selected timeframe
    const fees = pool.fees?.[timeframe]?.usd || 0;
    const tvl = pool.tvl_usdc || 0;
    
    console.log(`[APR] Fees (${timeframe}): ${fees}, TVL: ${tvl}`);

    // Prevent division by zero
    if (tvl <= 0) return 0;

    // Calculate APR: (fees / tvl) * (365 / days) * 100
    const days = {
      '24h': 1,
      '7d': 7,
      '30d': 30
    }[timeframe] || 1;

    const apr = (fees / tvl) * (365 / days) * 100;
    console.log(`[APR] Calculated APR: ${apr}%`);
    return apr;
  } catch (error) {
    console.error('[calculateFeeAPR] Error:', error.message);
    return 0;
  }
}

/**
 * Calculates the Volume/TVL ratio for a pool
 * @param {Object} pool - Pool data object
 * @param {string} timeframe - Timeframe for ratio calculation ('24h', '7d', '30d')
 * @returns {number} Volume/TVL ratio
 */
function calculateVolumeTVLRatio(pool, timeframe) {
  try {
    const volume = pool.volume?.[timeframe]?.usd || 0;
    const tvl = pool.tvl_usdc || 0;
    
    console.log(`[Ratio] Volume (${timeframe}): ${volume}, TVL: ${tvl}`);

    // Prevent division by zero
    if (tvl <= 0) return 0;

    const ratio = volume / tvl;
    console.log(`[Ratio] Calculated Volume/TVL Ratio: ${ratio}`);
    return ratio;
  } catch (error) {
    console.error('[calculateVolumeTVLRatio] Error:', error.message);
    return 0;
  }
}

/**
 * Calculates volatility indicator based on price changes
 * @param {Object} pool - Pool data object
 * @param {string} timeframe - Timeframe for volatility calculation ('24h', '7d', '30d')
 * @returns {string} Volatility level ('low', 'medium', 'high')
 */
function calculateVolatilityIndicator(pool, timeframe) {
  try {
    // Use price_change_pct if available, otherwise use price_change
    const priceChange = pool.price_change_pct?.[timeframe] || 
                        pool.price_change?.[timeframe] || 0;
    const absChange = Math.abs(priceChange);
    
    console.log(`[Volatility] Price change (${timeframe}): ${priceChange}%`);

    if (absChange < 5) return 'low';
    if (absChange < 15) return 'medium';
    return 'high';
  } catch (error) {
    console.error('[calculateVolatilityIndicator] Error:', error.message);
    return 'low';
  }
}

/**
 * Processes pool data to add derived metrics
 * @param {Object} pool - Raw pool data
 * @returns {Object} Processed pool data with derived metrics
 */
function processPoolData(pool) {
  try {
    // Make a copy of the pool data to avoid mutations
    const processedPool = { ...pool };

    // Parse string values if they exist
    // Convert string numeric values to numbers first
    if (typeof processedPool.tvl_usdc === 'string') {
      processedPool.tvl_usdc = parseFloat(processedPool.tvl_usdc);
    }

    // Ensure the stats objects exist
    ['24h', '7d', '30d'].forEach(timeframe => {
      // Create nested stats structure if it doesn't exist
      if (!processedPool.stats) processedPool.stats = {};
      if (!processedPool.stats[timeframe]) processedPool.stats[timeframe] = {};
      
      // Convert string values to numbers
      if (typeof processedPool.stats[timeframe].volume === 'string') {
        processedPool.stats[timeframe].volume = parseFloat(processedPool.stats[timeframe].volume);
      }
      
      if (typeof processedPool.stats[timeframe].fees === 'string') {
        processedPool.stats[timeframe].fees = parseFloat(processedPool.stats[timeframe].fees);
      }
      
      if (typeof processedPool.stats[timeframe].yield_over_tvl === 'string') {
        processedPool.stats[timeframe].yield_over_tvl = parseFloat(processedPool.stats[timeframe].yield_over_tvl);
      }
      
      // Structure for our derived metrics API
      if (!processedPool.fees) processedPool.fees = {};
      if (!processedPool.fees[timeframe]) processedPool.fees[timeframe] = { usd: 0 };
      
      if (!processedPool.volume) processedPool.volume = {};
      if (!processedPool.volume[timeframe]) processedPool.volume[timeframe] = { usd: 0 };
      
      // Copy values from stats to our standardized structure
      processedPool.fees[timeframe].usd = processedPool.stats[timeframe].fees || 0;
      processedPool.volume[timeframe].usd = processedPool.stats[timeframe].volume || 0;
    });

    // Display key metrics after parsing
    console.log('Processed pool data:', {
      tvl: processedPool.tvl_usdc,
      fees24h: processedPool.fees?.['24h']?.usd,
      volume24h: processedPool.volume?.['24h']?.usd
    });

    // Add derived metrics for each timeframe
    const timeframes = ['24h', '7d', '30d'];
    const metrics = {};

    timeframes.forEach(timeframe => {
      const feeAPR = calculateFeeAPR(processedPool, timeframe);
      const volumeTVLRatio = calculateVolumeTVLRatio(processedPool, timeframe);
      const volatility = calculateVolatilityIndicator(processedPool, timeframe);
      
      metrics[timeframe] = {
        feeAPR,
        volumeTVLRatio,
        volatility
      };
    });

    return {
      ...processedPool,
      metrics
    };
  } catch (error) {
    console.error('[processPoolData] Error:', error.message);
    return pool;
  }
}

/**
 * API endpoint to fetch all available pools or a specific pool
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Accept both "poolAddress" and "address" as parameter names for compatibility
    const address = req.query.poolAddress || req.query.address;

    // Fetch all pools regardless of whether an address is provided
    console.log('[pools API] Fetching all pools data');
    const poolsData = await fetchAllPools();
    
    // Verify pools data exists
    if (!poolsData || !poolsData.data || !Array.isArray(poolsData.data)) {
      console.error('[pools API] Invalid pools data structure:', poolsData);
      return res.status(500).json({ error: 'Invalid pools data structure from API' });
    }
    
    console.log(`[pools API] Processing ${poolsData.data.length} pools`);
    
    // Process each pool to add derived metrics
    const processedPools = poolsData.data.map(pool => processPoolData(pool));

    // If address is provided, filter to return just that pool
    if (address) {
      console.log(`[pools API] Filtering data for pool ${address}`);
      const filteredPool = processedPools.find(pool => pool.address === address);
      
      if (!filteredPool) {
        console.error(`[pools API] Pool ${address} not found in the fetched pools`);
        return res.status(404).json({ 
          error: `Pool not found: ${address}`
        });
      }
      
      return res.status(200).json({ data: [filteredPool] });
    }

    // Otherwise return all pools
    res.status(200).json({ data: processedPools });
  } catch (error) {
    console.error('Error in pools API:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch pools data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 