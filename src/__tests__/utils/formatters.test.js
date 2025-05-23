import {
  formatNumber,
  formatPercentage,
  formatValue,
  formatDuration,
  formatWalletAddress,
  formatFee
} from '../../utils/formatters';

describe('formatNumber', () => {
  test('handles null and undefined', () => {
    expect(formatNumber(null)).toBe('0.00');
    expect(formatNumber(undefined)).toBe('0.00');
  });

  test('formats regular numbers with 2 decimal places', () => {
    expect(formatNumber(123.456)).toBe('123.46');
    expect(formatNumber(-123.456)).toBe('-123.46');
    expect(formatNumber(0)).toBe('0.00');
  });

  test('formats small numbers with 6 decimal places', () => {
    expect(formatNumber(0.001234)).toBe('0.0012');
    expect(formatNumber(-0.001234)).toBe('-0.0012');
    expect(formatNumber(0.00000123)).toBe('0.0000');
  });

  test('abbreviates large numbers with K, M, B', () => {
    expect(formatNumber(1234)).toBe('1.23K');
    expect(formatNumber(1234567)).toBe('1.23M');
    expect(formatNumber(1234567890)).toBe('1.23B');
    expect(formatNumber(-1234567)).toBe('-1.23M');
  });

  test('disables abbreviation when requested', () => {
    expect(formatNumber(1234, false)).toBe('1,234.00');
    expect(formatNumber(1234567, false)).toBe('1,234,567.00');
    expect(formatNumber(-1234567, false)).toBe('-1,234,567.00');
  });
});

describe('formatPercentage', () => {
  test('handles null and undefined', () => {
    expect(formatPercentage(null)).toBe('0.00%');
    expect(formatPercentage(undefined)).toBe('0.00%');
  });

  test('formats decimal values as percentages', () => {
    expect(formatPercentage(0.15)).toBe('15.00%');
    expect(formatPercentage(-0.15)).toBe('-15.00%');
    expect(formatPercentage(0)).toBe('0.00%');
  });

  test('handles custom decimal places', () => {
    expect(formatPercentage(0.15678, 3)).toBe('15.678%');
    expect(formatPercentage(0.15, 0)).toBe('15%');
  });

  test('handles invalid input', () => {
    expect(formatPercentage('invalid')).toBe('N/A');
    expect(formatPercentage(NaN)).toBe('N/A');
  });
});

describe('formatValue', () => {
  test('handles null and undefined', () => {
    expect(formatValue(null)).toBe(' 0.00    ');
    expect(formatValue(undefined)).toBe(' 0.00    ');
  });

  test('formats regular values with padding', () => {
    expect(formatValue(123.456)).toBe(' 123.46    ');
    expect(formatValue(-123.456)).toBe('-123.46    ');
    expect(formatValue(0)).toBe(' 0.00    ');
  });

  test('formats small values with more precision', () => {
    expect(formatValue(0.001234)).toBe(' 0.0012    ');
    expect(formatValue(-0.001234)).toBe('-0.0012    ');
  });
});

describe('formatDuration', () => {
  test('handles invalid inputs', () => {
    expect(formatDuration(null)).toBe('Unknown');
    expect(formatDuration(undefined)).toBe('Unknown');
    expect(formatDuration(0)).toBe('Unknown');
    expect(formatDuration(-1)).toBe('Unknown');
  });

  test('formats seconds only', () => {
    expect(formatDuration(1)).toBe('1s');
    expect(formatDuration(45)).toBe('45s');
  });

  test('formats minutes and seconds', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(120)).toBe('2m');
  });

  test('formats hours', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(7200)).toBe('2h');
  });

  test('formats days', () => {
    expect(formatDuration(86400)).toBe('1d');
    expect(formatDuration(90000)).toBe('1d 1h');
    expect(formatDuration(172800)).toBe('2d');
  });

  test('formats complex durations', () => {
    expect(formatDuration(93784)).toBe('1d 2h 3m');
    expect(formatDuration(93790)).toBe('1d 2h 3m 10s');
  });
});

describe('formatWalletAddress', () => {
  test('handles invalid inputs', () => {
    expect(formatWalletAddress(null)).toBe('Unknown');
    expect(formatWalletAddress(undefined)).toBe('Unknown');
    expect(formatWalletAddress('')).toBe('Unknown');
    expect(formatWalletAddress('123')).toBe('Unknown');
  });

  test('formats valid addresses', () => {
    expect(formatWalletAddress('0x1234567890abcdef')).toBe('0x1234...cdef');
    expect(formatWalletAddress('1234567890abcdef1234')).toBe('123456...1234');
  });
});

describe('formatFee', () => {
  test('handles null and undefined', () => {
    expect(formatFee(null)).toBe('$0.00');
    expect(formatFee(undefined)).toBe('$0.00');
  });

  test('formats regular fees', () => {
    expect(formatFee(123.456)).toBe('$123.46');
    expect(formatFee(-123.456)).toBe('$-123.46');
    expect(formatFee(0)).toBe('$0.00');
  });

  test('formats large fees with abbreviations', () => {
    expect(formatFee(1234)).toBe('$1.23K');
    expect(formatFee(1234567)).toBe('$1.23M');
    expect(formatFee(1234567890)).toBe('$1.23B');
  });

  test('disables abbreviation when requested', () => {
    expect(formatFee(1234, false)).toBe('$1,234.00');
    expect(formatFee(1234567, false)).toBe('$1,234,567.00');
  });
}); 