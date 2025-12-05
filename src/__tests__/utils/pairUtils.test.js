import {
  invertPairString,
  invertPrice,
  getAdjustedPosition,
} from '../../utils/pairUtils';

describe('invertPairString', () => {
  it('handles invalid inputs', () => {
    expect(invertPairString(null)).toBe('');
    expect(invertPairString(undefined)).toBe('');
    expect(invertPairString(123)).toBe('');
    expect(invertPairString('')).toBe('');
  });

  it('handles invalid pair format', () => {
    expect(invertPairString('SOLUSDC')).toBe('SOLUSDC');
    expect(invertPairString('SOL-USDC')).toBe('SOL-USDC');
  });

  it('inverts valid pair strings', () => {
    expect(invertPairString('SOL/USDC')).toBe('USDC/SOL');
    expect(invertPairString('BTC/ETH')).toBe('ETH/BTC');
    expect(invertPairString('A/B')).toBe('B/A');
  });

  it('handles malformed pairs gracefully', () => {
    expect(invertPairString('/')).toBe('/');
    expect(invertPairString('SOL/')).toBe('SOL/');
    expect(invertPairString('/USDC')).toBe('/USDC');
    expect(invertPairString('SOL//')).toBe('SOL//');
  });

  it('handles errors gracefully', () => {
    const pair = {
      toString: () => {
        throw new Error('Mock error');
      },
    };
    expect(invertPairString(pair)).toBe('');
  });
});

describe('invertPrice', () => {
  it('handles invalid inputs', () => {
    expect(invertPrice(null)).toBeNull();
    expect(invertPrice(undefined)).toBeNull();
    expect(invertPrice(NaN)).toBeNull();
    expect(invertPrice('not a number')).toBeNull();
  });

  it('handles special cases', () => {
    expect(invertPrice(Infinity)).toBe(0);
    expect(invertPrice(Number.POSITIVE_INFINITY)).toBe(0);
    expect(invertPrice(0)).toBe(0);
    expect(invertPrice(-0)).toBe(0);
  });

  it('inverts valid prices', () => {
    expect(invertPrice(2)).toBe(0.5);
    expect(invertPrice(0.5)).toBe(2);
    expect(invertPrice(1)).toBe(1);
    expect(invertPrice(4)).toBe(0.25);
  });

  it('handles very large and small numbers', () => {
    expect(invertPrice(1e10)).toBe(1e-10);
    expect(invertPrice(1e-10)).toBe(1e10);
    expect(invertPrice(Number.MAX_SAFE_INTEGER)).toBeCloseTo(0);
    expect(invertPrice(Number.MIN_VALUE)).toBe(Infinity);
  });

  it('handles errors gracefully', () => {
    const mockPrice = {
      valueOf: () => {
        throw new Error('Mock error');
      },
    };
    expect(invertPrice(mockPrice)).toBeNull();
  });
});

describe('getAdjustedPosition', () => {
  it('handles invalid inputs', () => {
    expect(getAdjustedPosition(null, true)).toEqual({});
    expect(getAdjustedPosition(undefined, true)).toEqual({});
  });

  it('returns original position when not inverted', () => {
    const position = {
      currentPrice: 2,
      entryPrice: 1.5,
      liquidationPrice: { lower: 1, upper: 3 },
      rangePrices: { lower: 1.2, upper: 2.8 },
      limitOrderPrices: { lower: 1.1, upper: 2.9 },
    };
    expect(getAdjustedPosition(position, false)).toBe(position);
  });

  it('adjusts position data when inverted', () => {
    const position = {
      currentPrice: 2,
      entryPrice: 1.5,
      liquidationPrice: { lower: 1, upper: 3 },
      rangePrices: { lower: 1.2, upper: 2.8 },
      limitOrderPrices: { lower: 1.1, upper: 2.9 },
      otherData: 'preserved',
    };

    const expected = {
      currentPrice: 0.5,
      entryPrice: 1 / 1.5,
      liquidationPrice: { lower: 1 / 3, upper: 1 },
      rangePrices: { lower: 1 / 2.8, upper: 1 / 1.2 },
      limitOrderPrices: { lower: 1 / 2.9, upper: 1 / 1.1 },
      otherData: 'preserved',
    };

    expect(getAdjustedPosition(position, true)).toEqual(expected);
  });

  it('handles missing nested objects', () => {
    const position = {
      currentPrice: 2,
      entryPrice: 1.5,
    };

    const expected = {
      currentPrice: 0.5,
      entryPrice: 1 / 1.5,
      liquidationPrice: { lower: null, upper: null },
      rangePrices: { lower: null, upper: null },
      limitOrderPrices: { lower: null, upper: null },
    };

    expect(getAdjustedPosition(position, true)).toEqual(expected);
  });

  it('handles null values in nested objects', () => {
    const position = {
      currentPrice: 2,
      entryPrice: null,
      liquidationPrice: { lower: null, upper: 3 },
      rangePrices: { lower: 1.2, upper: null },
      limitOrderPrices: null,
    };

    const expected = {
      currentPrice: 0.5,
      entryPrice: null,
      liquidationPrice: { lower: 1 / 3, upper: null },
      rangePrices: { lower: null, upper: 1 / 1.2 },
      limitOrderPrices: { lower: null, upper: null },
    };

    expect(getAdjustedPosition(position, true)).toEqual(expected);
  });

  it('handles malformed position objects', () => {
    const position = {
      currentPrice: 'invalid',
      entryPrice: {},
      liquidationPrice: 'not an object',
      rangePrices: null,
      limitOrderPrices: [],
    };

    const expected = {
      currentPrice: null,
      entryPrice: null,
      liquidationPrice: { lower: null, upper: null },
      rangePrices: { lower: null, upper: null },
      limitOrderPrices: { lower: null, upper: null },
    };

    expect(getAdjustedPosition(position, true)).toEqual(expected);
  });

  it('handles errors gracefully', () => {
    const position = {
      get currentPrice() {
        throw new Error('Mock error');
      },
    };
    expect(getAdjustedPosition(position, true)).toBe(position);
  });
});
