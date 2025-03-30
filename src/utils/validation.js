/**
 * Validation utilities for user inputs and data.
 * This module provides functions to validate various types of data
 * including wallet addresses, numbers, strings, arrays, and more.
 */

// Constants for validation
const WALLET_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Validates a Solana wallet address
 * @param {string} address - The wallet address to validate
 * @returns {boolean} - Whether the address is valid
 */
export const isValidWalletAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  return WALLET_ADDRESS_REGEX.test(address.trim());
};
