/**
 * Utilities for handling position data and formatting.
 */

// --- Constants ---
const USD_MULTIPLIER = 100;       // Convert cents back to dollars (2 decimal places)
const PRICE_MULTIPLIER = 1000000; // 6 decimal places for prices
const LEVERAGE_MULTIPLIER = 100;  // 2 decimal places for leverage

// --- Helper Functions ---

/**
 * Decodes an encoded numeric value back to its original decimal form
 * @param {number|null} value - The encoded integer value 
 * @param {number} multiplier - The multiplier used for encoding
 * @return {number|null} The decoded decimal value
 */
export const decodeValue = (value, multiplier) => {
  if (value === null || value === undefined) return null;
  return value / multiplier;
};

// --- Exported Utility Functions ---

/**
 * Get CSS class for value styling based on sign
 * @param {number|null|undefined} value - The value to check
 * @returns {string} The CSS class name ('positive', 'negative', or 'zero')
 */
export const getValueClass = (value) => {
  if (value === null || value === undefined) return 'zero'; // Treat null/undefined as zero for styling
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'zero';
};

/**
 * Get CSS class for position state
 * @param {string} state - The position state (e.g., 'In range', 'Liquidated')
 * @returns {string} The CSS class name
 */
export const getStateClass = (state) => {
  switch (state) {
    case 'In range': return 'stateInRange';
    case 'Out of range': return 'stateWarning';
    case 'Closed': 
    case 'Limit Closed': return 'stateClosed';
    case 'Liquidated': return 'stateLiquidated';
    case 'Open (Unknown Range)': return 'stateOpenUnknown'; // Add class for unknown range
    default: return ''; // Default class if state is unknown or not relevant for styling
  }
};

/**
 * Calculates the display status of a position based on its state and prices.
 * @param {object} position - The position object containing state, currentPrice, and rangePrices.
 * @returns {string} The display status string ('In range', 'Out of range', 'Closed', etc.).
 */
export const calculateStatus = (position) => {
  if (!position || !position.state) return 'Unknown';

  // Handle non-'open' states directly
  if (position.state !== 'open') {
    switch (position.state) {
      case 'closed': return 'Closed';
      case 'liquidated': return 'Liquidated';
      case 'closed_by_limit_order': return 'Limit Closed';
      default:
        // Capitalize the first letter of unknown states
        return position.state.charAt(0).toUpperCase() + position.state.slice(1);
    }
  }

  // For 'open' state, check price availability
  if (
    position.currentPrice == null || 
    !position.rangePrices || 
    position.rangePrices.lower == null || 
    position.rangePrices.upper == null
  ) {
    return 'Open (Unknown Range)';
  }

  // Check if current price is within the range prices
  const isInRange = position.currentPrice >= position.rangePrices.lower && 
                    position.currentPrice <= position.rangePrices.upper;

  return isInRange ? 'In range' : 'Out of range';
};

/**
 * Adds wallet address to each position in the array.
 * (Used to restore the wallet address removed from server response).
 * 
 * @param {Array} positions - Array of position objects
 * @param {string} walletAddress - The wallet address to add to each position
 * @return {Array} - Positions with wallet address added (or empty array if input is invalid).
 */
export const addWalletAddressToPositions = (positions, walletAddress) => {
  if (!positions || !Array.isArray(positions)) return [];
  
  return positions.map(position => ({
    ...position,
    walletAddress
  }));
};

/**
 * Decodes a position object with encoded values into a client-ready object.
 * Maps short API keys to more descriptive client-side keys.
 * 
 * @param {Object} position - The position object from the API with encoded values.
 * @return {Object|null} Position object with decoded values and descriptive keys, or null if input is invalid.
 */
export const decodePosition = (position) => {
  if (!position) return null;
  
  const decoded = {
    positionAddress: position.p_addr,
    state: position.state,
    pair: position.pair,
    
    currentPrice: decodeValue(position.c_price, PRICE_MULTIPLIER),
    entryPrice: decodeValue(position.e_price, PRICE_MULTIPLIER),
    leverage: decodeValue(position.lev, LEVERAGE_MULTIPLIER),
    size: decodeValue(position.sz, USD_MULTIPLIER),
    
    rangePrices: {
      lower: decodeValue(position.r_prices?.l, PRICE_MULTIPLIER),
      upper: decodeValue(position.r_prices?.u, PRICE_MULTIPLIER)
    },
    liquidationPrice: {
      lower: decodeValue(position.liq_price?.l, PRICE_MULTIPLIER),
      upper: decodeValue(position.liq_price?.u, PRICE_MULTIPLIER)
    },
    limitOrderPrices: {
      lower: decodeValue(position.lim_prices?.l, PRICE_MULTIPLIER),
      upper: decodeValue(position.lim_prices?.u, PRICE_MULTIPLIER)
    },
    
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
    collateral: {
      usd: decodeValue(position.col?.u, USD_MULTIPLIER)
    },
    debt: {
      usd: decodeValue(position.dbt?.u, USD_MULTIPLIER)
    },
    interest: {
      usd: decodeValue(position.int?.u, USD_MULTIPLIER)
    },
    
    // Include opened_at if available in the position data
    opened_at: position.opened_at
  };
  
  // Add derived/calculated properties (optional, can be done later)
  decoded.displayStatus = calculateStatus(decoded); 
  
  return decoded;
};

/**
 * Decodes an array of positions with encoded values into client-ready objects.
 * @param {Array} positions - Array of positions with encoded values from the API.
 * @return {Array} Array of positions with decoded values and descriptive keys.
 */
export const decodePositions = (positions) => {
  if (!positions || !Array.isArray(positions)) return [];
  return positions.map(position => decodePosition(position)).filter(Boolean); // Filter out null results from decodePosition
}; 