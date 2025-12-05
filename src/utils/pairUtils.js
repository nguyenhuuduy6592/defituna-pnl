/**
 * Token pair utilities.
 * This module provides functions for manipulating token pairs and prices,
 * particularly for handling pair inversions and token operations.
 */

/**
 * Inverts a pair string (e.g., "SOL/USDC" -> "USDC/SOL")
 * @param {string} pair - The pair string to invert
 * @returns {string} The inverted pair string or original pair if invalid
 */
export const invertPairString = (pair) => {
  try {
    if (!pair || typeof pair !== 'string') {
      console.warn('[invertPairString] Invalid pair provided:', pair);
      return '';
    }

    if (!pair.includes('/')) {
      console.warn('[invertPairString] Invalid pair format (missing separator):', pair);
      return pair;
    }

    const parts = pair.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      console.warn('[invertPairString] Malformed pair format:', pair);
      return pair;
    }

    const [tokenA, tokenB] = parts;
    return `${tokenB}/${tokenA}`;
  } catch (error) {
    console.error('[invertPairString] Error inverting pair:', error);
    return pair || '';
  }
};

/**
 * Inverts a price value, handling edge cases
 * @param {number} price - The price to invert
 * @returns {number} The inverted price
 */
export const invertPrice = (price) => {
  try {
    if (price === null || price === undefined || isNaN(price)) {
      return null;
    }

    if (price === Infinity || price === Number.POSITIVE_INFINITY) {
      return 0;
    }

    if (price === 0 || price === -0) {
      return 0;
    }

    return 1 / price;
  } catch (error) {
    console.error('[invertPrice] Error inverting price:', error);
    return null;
  }
};

/**
 * Adjusts position data for inverted pairs
 * @param {Object} position - The position data
 * @param {boolean} isInverted - Whether the pair is inverted
 * @returns {Object} The adjusted position data
 */
export const getAdjustedPosition = (position, isInverted) => {
  if (!position) {
    console.warn('[getAdjustedPosition] Invalid position provided');
    return {};
  }

  if (!isInverted) {return position;}

  try {
    return {
      ...position,
      currentPrice: invertPrice(position.currentPrice),
      entryPrice: invertPrice(position.entryPrice),
      liquidationPrice: {
        lower: invertPrice(position.liquidationPrice?.upper),
        upper: invertPrice(position.liquidationPrice?.lower),
      },
      rangePrices: {
        lower: invertPrice(position.rangePrices?.upper),
        upper: invertPrice(position.rangePrices?.lower),
      },
      limitOrderPrices: {
        lower: invertPrice(position.limitOrderPrices?.upper),
        upper: invertPrice(position.limitOrderPrices?.lower),
      },
    };
  } catch (error) {
    console.error('[getAdjustedPosition] Error adjusting position for inversion:', error);
    return position;
  }
};
