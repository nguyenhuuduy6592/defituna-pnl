/**
 * Formats a number with appropriate decimal places based on its magnitude
 * @param {number} num - The number to format
 * @returns {string} The formatted number as a string
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0.00';
  
  if (Math.abs(num) < 0.01 && num !== 0) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    });
  } else {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
};

export const formatValue = (val) => {
  if (Math.abs(val) < 0.01 && val !== 0) {
    return `${val >= 0 ? ' ' : '-'}${Math.abs(val).toFixed(6)}`.padStart(8);
  } else {
    return `${val >= 0 ? ' ' : '-'}${Math.abs(val).toFixed(2)}`.padStart(8);
  }
};

export const formatDuration = (ageSeconds) => {
  if (ageSeconds === null || ageSeconds === undefined || ageSeconds === 0) return 'Unknown';
  
  const days = Math.floor(ageSeconds / 86400);
  const hours = Math.floor((ageSeconds % 86400) / 3600);
  const minutes = Math.floor((ageSeconds % 3600) / 60);
  const seconds = ageSeconds % 60;
  
  if (days > 0) {
    if (hours > 0) {
      return minutes > 0 ? `${days}d ${hours}h ${minutes}m` : `${days}d ${hours}h`;
    } else {
      return minutes > 0 ? `${days}d ${minutes}m` : `${days}d`;
    }
  } else if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

export const formatWalletAddress = (address) => {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}; 