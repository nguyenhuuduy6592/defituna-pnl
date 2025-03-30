/**
 * Style utility functions.
 * This module provides functions to determine style classes and
 * handle conditional styling throughout the application.
 */

/**
 * Determines the appropriate CSS class based on a numeric value
 * @param {number} value - The numeric value to classify
 * @param {Object} [options] - Options for classification
 * @param {number} [options.threshold=0] - Threshold for considering value significant
 * @param {boolean} [options.useThreshold=false] - Whether to apply threshold
 * @returns {string} CSS class name: 'positive', 'negative', or 'neutral'
 */
export const getValueClass = (value) => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'zero';
};