/**
 * Inverts a pair string (e.g., "SOL/USDC" -> "USDC/SOL")
 * @param {string} pair - The pair string to invert
 * @returns {string} The inverted pair string
 */
export const invertPairString = (pair) => {
  const [tokenA, tokenB] = pair.split('/');
  return `${tokenB}/${tokenA}`;
};

/**
 * Inverts a price value, handling edge cases
 * @param {number} price - The price to invert
 * @returns {number} The inverted price
 */
export const invertPrice = (price) => {
  if (price === null || price === undefined) return null;
  if (price === Infinity) return 0;
  if (price === 0) return Infinity;
  return 1 / price;
};

/**
 * Adjusts position data for inverted pairs
 * @param {Object} position - The position data
 * @param {boolean} isInverted - Whether the pair is inverted
 * @returns {Object} The adjusted position data
 */
export const getAdjustedPosition = (position, isInverted) => {
  if (!isInverted) return position;
  
  return {
    ...position,
    currentPrice: invertPrice(position.currentPrice),
    entryPrice: invertPrice(position.entryPrice),
    liquidationPrice: {
      lower: invertPrice(position.liquidationPrice.upper),
      upper: invertPrice(position.liquidationPrice.lower)
    },
    rangePrices: {
      lower: invertPrice(position.rangePrices.upper),
      upper: invertPrice(position.rangePrices.lower)
    },
    limitOrderPrices: {
      lower: invertPrice(position.limitOrderPrices.upper),
      upper: invertPrice(position.limitOrderPrices.lower)
    }
  };
}; 