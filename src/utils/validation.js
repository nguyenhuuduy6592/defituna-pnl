/**
 * Validation utilities for user inputs and data.
 * This module provides functions to validate various types of data
 * including wallet addresses, numbers, strings, arrays, and more.
 */

// Constants for validation
const MIN_ADDRESS_LENGTH = 32;
const MAX_ADDRESS_LENGTH = 44;
const VALID_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const WALLET_ADDRESS_REGEX = new RegExp(`^[${VALID_CHARS}]{${MIN_ADDRESS_LENGTH},${MAX_ADDRESS_LENGTH}}$`);
const INVALID_CHARS_REGEX = /[0IOl]/;

/**
 * Validates a Solana wallet address
 * @param {string} address - The wallet address to validate
 * @returns {boolean} - Whether the address is valid
 */
export const isValidWalletAddress = (address) => {
  // Check for null, undefined, or non-string types
  if (!address || typeof address !== 'string') return false;

  // Trim whitespace
  const trimmed = address.trim();

  // Check length before any other validation
  const length = trimmed.length;
  if (length !== 44) {
    return false;
  }

  // Check for invalid characters (0, I, O, l)
  if (INVALID_CHARS_REGEX.test(trimmed)) {
    return false;
  }

  // Check that all characters are valid base58 characters
  if (!WALLET_ADDRESS_REGEX.test(trimmed)) {
    return false;
  }

  return true;
};
