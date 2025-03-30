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