/**
 * Get CSS class for value styling
 * @param {number} value - The value to check
 * @returns {string} The CSS class name
 */
export const getValueClass = (value) => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'zero';
};

/**
 * Get CSS class for position state
 * @param {string} state - The position state
 * @returns {string} The CSS class name
 */
export const getStateClass = (state) => {
  switch (state) {
    case 'In range': return 'stateInRange';
    case 'Out of range': return 'stateWarning';
    case 'Closed': return 'stateClosed';
    case 'Limit Closed': return 'stateClosed';
    case 'Liquidated': return 'stateLiquidated';
    default: return '';
  }
};

/**
 * Calculates the percentage value from Basis Points (BPS).
 * @param {number} bps - The value in basis points.
 * @returns {number} The percentage value.
 */
export const calculatePnlPercentage = (bps) => {
  if (bps == null) return 0;
  return bps / 100;
};

/**
 * Calculates the display status of a position based on its state and prices.
 * @param {object} position - The position object containing state, currentPrice, and rangePrices.
 * @returns {string} The display status string ('In range', 'Out of range', 'Closed', 'Unknown', etc.).
 */
export const calculateStatus = (position) => {
  if (!position || !position.state) return 'Unknown';

  // Handle non-'open' states directly
  if (position.state !== 'open') {
    switch (position.state) {
      case 'closed':
        return 'Closed';
      case 'liquidated':
        return 'Liquidated';
      case 'closed_by_limit_order': // Assuming this is the state name from the API
        return 'Limit Closed';
      // Add other potential states here if known
      default:
        // Fallback for unknown non-open states - capitalize or return as is
        return position.state.charAt(0).toUpperCase() + position.state.slice(1);
    }
  }

  // For 'open' state, check if prices are available
  if (position.currentPrice == null || !position.rangePrices || position.rangePrices.lower == null || position.rangePrices.upper == null) {
    return 'Open (Unknown Range)'; // Or just 'Open'
  }

  // Check if current price is within the range prices
  const isInRange = position.currentPrice >= position.rangePrices.lower && 
                    position.currentPrice <= position.rangePrices.upper;

  return isInRange ? 'In range' : 'Out of range';
};

/**
 * Adds wallet address to each position in the array
 * This is used to restore the wallet address that was removed from the server response
 * to reduce payload size
 * 
 * @param {Array} positions - Array of position objects
 * @param {string} walletAddress - The wallet address to add to each position
 * @return {Array} - Positions with wallet address added
 */
export function addWalletAddressToPositions(positions, walletAddress) {
  if (!positions || !Array.isArray(positions)) return [];
  
  return positions.map(position => ({
    ...position,
    walletAddress
  }));
}

// --- Value Decoding Constants ---
const USD_MULTIPLIER = 100;       // Convert cents back to dollars (2 decimal places)
const PRICE_MULTIPLIER = 1000000; // 6 decimal places for prices
const LEVERAGE_MULTIPLIER = 100;  // 2 decimal places for leverage

/**
 * Decodes an encoded numeric value back to its original decimal form
 * @param {number|null} value - The encoded integer value 
 * @param {number} multiplier - The multiplier used for encoding
 * @return {number|null} The decoded decimal value
 */
export function decodeValue(value, multiplier) {
  if (value === null || value === undefined) return null;
  return value / multiplier;
}

/**
 * Decodes a position object with encoded values into client-ready object
 * @param {Object} position - The position with encoded values
 * @return {Object} Position with decoded values
 */
export function decodePosition(position) {
  if (!position) return null;
  
  return {
    positionAddress: position.p_addr,
    state: position.state,
    pair: position.pair,
    
    // Decode price data
    currentPrice: decodeValue(position.c_price, PRICE_MULTIPLIER),
    entryPrice: decodeValue(position.e_price, PRICE_MULTIPLIER),
    rangePrices: {
      lower: decodeValue(position.r_prices?.l, PRICE_MULTIPLIER),
      upper: decodeValue(position.r_prices?.u, PRICE_MULTIPLIER)
    },
    
    // Decode liquidation and limit prices
    liquidationPrice: {
      lower: decodeValue(position.liq_price?.l, PRICE_MULTIPLIER),
      upper: decodeValue(position.liq_price?.u, PRICE_MULTIPLIER)
    },
    limitOrderPrices: {
      lower: decodeValue(position.lim_prices?.l, PRICE_MULTIPLIER),
      upper: decodeValue(position.lim_prices?.u, PRICE_MULTIPLIER)
    },
    
    // Decode position data
    leverage: decodeValue(position.lev, LEVERAGE_MULTIPLIER),
    size: decodeValue(position.sz, USD_MULTIPLIER),
    
    // Decode financial metrics
    pnl: {
      usd: decodeValue(position.pnl?.u, USD_MULTIPLIER),
      bps: position.pnl?.b // bps was not encoded
    },
    yield: {
      usd: decodeValue(position.yld?.u, USD_MULTIPLIER)
    },
    compounded: {
      usd: decodeValue(position.cmp?.u, USD_MULTIPLIER)
    },
    
    // Decode display amounts
    collateral: {
      usd: decodeValue(position.col?.u, USD_MULTIPLIER)
    },
    debt: {
      usd: decodeValue(position.dbt?.u, USD_MULTIPLIER)
    },
    interest: {
      usd: decodeValue(position.int?.u, USD_MULTIPLIER)
    }
  };
}

/**
 * Decodes an array of positions with encoded values into client-ready objects
 * @param {Array} positions - Array of positions with encoded values
 * @return {Array} Array of positions with decoded values
 */
export function decodePositions(positions) {
  if (!positions || !Array.isArray(positions)) return [];
  return positions.map(position => decodePosition(position));
} 