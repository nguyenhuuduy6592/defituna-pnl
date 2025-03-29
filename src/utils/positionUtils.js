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
    case 'Liquidated': return 'stateLiquidated';
    default: return '';
  }
}; 