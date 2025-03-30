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
 * Uses `toLocaleString` for locale-aware formatting.
 * 
 * @param {number|null|undefined} num - The number to format.
 * @returns {string} The formatted number as a string (defaults to '0.00' if input is invalid).
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0.00';
  
  const absNum = Math.abs(num);
  const options = {
    minimumFractionDigits: MIN_FRACTION_DIGITS_DEFAULT,
    maximumFractionDigits: MAX_FRACTION_DIGITS_DEFAULT,
  };

  if (absNum < SMALL_NUMBER_THRESHOLD && num !== 0) {
    options.minimumFractionDigits = MIN_FRACTION_DIGITS_SMALL;
    options.maximumFractionDigits = MAX_FRACTION_DIGITS_SMALL;
  }
  
  return num.toLocaleString(DEFAULT_LOCALE, options);
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
  
  return `${sign}${formattedVal}`.padStart(8); // Ensure consistent padding (adjust padStart value if needed)
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
  const seconds = Math.floor(ageSeconds % 60); // Use floor for consistency
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  // Only show seconds if duration is less than a minute
  if (parts.length === 0 && seconds > 0) {
    parts.push(`${seconds}s`);
  }
  
  // If still no parts (e.g., ageSeconds was between 0 and 1), default to 1s or keep Unknown?
  if (parts.length === 0) return '1s'; // Or decide if 'Unknown' is better for < 1s

  return parts.slice(0, 3).join(' '); // Join up to 3 most significant parts
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