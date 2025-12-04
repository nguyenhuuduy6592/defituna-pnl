/**
 * Utilities for handling position data and formatting.
 */


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
 * Maps position object with raw decimal values to client-ready object with descriptive keys.
 *
 * @param {Object} position - The position object from the API with raw decimal values.
 * @return {Object|null} Position object with descriptive keys, or null if input is invalid.
 */
export const decodePosition = (position) => {
  if (!position) return null;

  const decoded = {
    positionAddress: position.p_addr,
    state: position.state,
    pair: position.pair,

    // Raw decimal values - no decoding needed
    currentPrice: position.c_price,
    entryPrice: position.e_price,
    leverage: position.lev,
    size: position.sz,

    rangePrices: {
      lower: position.r_prices?.l,
      upper: position.r_prices?.u
    },
    liquidationPrice: {
      lower: position.liq_price?.l,
      upper: position.liq_price?.u
    },
    limitOrderPrices: {
      lower: position.lim_prices?.l,
      upper: position.lim_prices?.u
    },

    pnl: {
      usd: position.pnl?.u,
      bps: position.pnl?.b
    },
    yield: {
      usd: position.yld?.u
    },
    compounded: {
      usd: position.cmp?.u
    },
    collateral: {
      usd: position.col?.u
    },
    debt: {
      usd: position.dbt?.u
    },
    interest: {
      usd: position.int?.u
    },

    // Include opened_at if available in the position data
    opened_at: position.opened_at,

    pnlData: position.pnlData,
    yieldData: position.yieldData,
    compoundedData: position.compoundedData,
    symbol: position.symbol,
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