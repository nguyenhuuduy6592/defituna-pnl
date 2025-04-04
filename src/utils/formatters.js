/**
 * Utilities for formatting numbers, durations, and addresses.
 */

// --- Constants ---
const DEFAULT_LOCALE = undefined; // Use browser default locale
const SMALL_NUMBER_THRESHOLD = 0.01;
const MIN_FRACTION_DIGITS_SMALL = 6;
const MAX_FRACTION_DIGITS_SMALL = 6;
const MIN_FRACTION_DIGITS_DEFAULT = 2;
const MAX_FRACTION_DIGITS_DEFAULT = 2;

// --- Formatting Functions ---

/**
 * Formats a number with appropriate decimal places based on its magnitude.
 * For large numbers, uses K, M, B suffixes for thousands, millions, billions.
 * For small numbers, uses more decimal places for precision.
 * 
 * @param {number|null|undefined} num - The number to format.
 * @param {boolean} abbreviate - Whether to abbreviate large numbers with K, M, B (default: true).
 * @returns {string} The formatted number as a string (defaults to '0.00' if input is invalid).
 */
export const formatNumber = (num, abbreviate = true) => {
  if (num === null || num === undefined) return '0.00';
  
  const number = Number(num);
  const absNum = Math.abs(number);
  const sign = number < 0 ? '-' : '';
  
  // Handle large number abbreviations if requested
  if (abbreviate) {
    if (absNum >= 1e9) return sign + (absNum / 1e9).toFixed(2) + 'B';
    if (absNum >= 1e6) return sign + (absNum / 1e6).toFixed(2) + 'M';
    if (absNum >= 1e3) return sign + (absNum / 1e3).toFixed(2) + 'K';
  }
  
  // Handle small numbers with more precision
  const options = {
    minimumFractionDigits: MIN_FRACTION_DIGITS_DEFAULT,
    maximumFractionDigits: MAX_FRACTION_DIGITS_DEFAULT,
  };

  if (absNum < SMALL_NUMBER_THRESHOLD && number !== 0) {
    options.minimumFractionDigits = MIN_FRACTION_DIGITS_SMALL;
    options.maximumFractionDigits = MAX_FRACTION_DIGITS_SMALL;
  }
  
  return sign + absNum.toLocaleString(DEFAULT_LOCALE, options);
};

/**
 * Formats a percentage value
 * @param {number} value - Percentage value in decimal form (e.g., 0.15 for 15%)
 * @param {number} digits - Number of decimal places
 * @returns {string} Formatted percentage with % suffix
 */
export const formatPercentage = (value, digits = 2) => {
  if (value === null || value === undefined) return '0.00%';
  
  const percentValue = Number(value) * 100;
  if (isNaN(percentValue)) return 'N/A';
  
  return percentValue.toFixed(digits) + '%';
};

/**
 * Formats a value (e.g., PnL) with fixed decimal places and padding for alignment.
 * Handles small values with more precision.
 * 
 * @param {number|null|undefined} val - The value to format.
 * @returns {string} The formatted value as a string (defaults to ' 0.00    ' if input is invalid).
 */
export const formatValue = (val) => {
  if (val === null || val === undefined) return ' 0.00    '; // Padded default

  const absVal = Math.abs(val);
  const sign = val >= 0 ? ' ' : '-'; // Space for positive, minus for negative
  let formattedVal;

  if (absVal < SMALL_NUMBER_THRESHOLD && val !== 0) {
    formattedVal = absVal.toFixed(MIN_FRACTION_DIGITS_SMALL);
  } else {
    formattedVal = absVal.toFixed(MIN_FRACTION_DIGITS_DEFAULT);
  }
  
  return `${sign}${formattedVal}    `; // Add consistent padding with 4 spaces
};

/**
 * Formats a duration given in seconds into a human-readable string (e.g., '1d 2h 3m').
 * 
 * @param {number|null|undefined} ageSeconds - The duration in seconds.
 * @returns {string} The formatted duration string (defaults to 'Unknown' if input is invalid or zero).
 */
export const formatDuration = (ageSeconds) => {
  if (ageSeconds === null || ageSeconds === undefined || ageSeconds <= 0) return 'Unknown';
  
  const days = Math.floor(ageSeconds / 86400);
  const hours = Math.floor((ageSeconds % 86400) / 3600);
  const minutes = Math.floor((ageSeconds % 3600) / 60);
  const seconds = Math.floor(ageSeconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  // Show seconds in these cases:
  // 1. When there are no larger units
  // 2. When we have exactly minutes and seconds (e.g., "1m 30s")
  // 3. When we have days/hours, minutes, and significant seconds (>= 10s)
  if (seconds > 0 && (
    parts.length === 0 || // No larger units
    (parts.length === 1 && minutes > 0) || // Only minutes present
    (parts.length === 2 && ((days > 0 && minutes > 0) || (hours > 0 && minutes > 0)) && seconds >= 10) || // Days/hours and minutes present, and at least 10 seconds
    (parts.length === 3 && seconds >= 10) // All larger units present and at least 10 seconds
  )) {
    parts.push(`${Math.max(1, seconds)}s`);
  }
  
  // If no parts (e.g., ageSeconds was between 0 and 1), default to 1s
  if (parts.length === 0) return '1s';
  
  return parts.join(' ');
};

/**
 * Formats a wallet address for display by showing the first 6 and last 4 characters.
 * 
 * @param {string|null|undefined} address - The wallet address string.
 * @returns {string} The formatted address (e.g., '0x1234...abcd') or 'Unknown' if input is invalid.
 */
export const formatWalletAddress = (address) => {
  if (!address || typeof address !== 'string' || address.length < 10) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Formats a fee value with dollar sign and appropriate abbreviations
 * @param {number} fee - The fee value
 * @param {boolean} abbreviate - Whether to abbreviate large values with K, M, B
 * @returns {string} Formatted fee with $ prefix
 */
export const formatFee = (fee, abbreviate = true) => {
  if (fee === null || fee === undefined) return '$0.00';
  
  return '$' + formatNumber(fee, abbreviate);
}; 