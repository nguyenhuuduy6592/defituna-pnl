import {
  getTokenMetadata,
  batchGetTokenMetadata,
  calculatePriceFromSqrtPrice,
  enhancePoolWithTokenMetadata
} from '../../utils/tokens';

// Mock global fetch
global.fetch = jest.fn();

describe('Token Metadata Utils', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('getTokenMetadata', () => {
    it('returns placeholder for unknown tokens', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API error'));
      
      const result = await getTokenMetadata('unknownToken123');
      expect(result).toEqual({
        symbol: 'unkn...n123',
        name: 'unkn...n123',
        decimals: 9
      });
    });

    it('returns placeholder when API fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API error'));
      
      const result = await getTokenMetadata('token123');
      expect(result).toEqual({
        symbol: 'toke...n123',
        name: 'toke...n123',
        decimals: 9
      });
    });

    it('returns placeholder for null/undefined input', async () => {
      const result = await getTokenMetadata(null);
      expect(result).toEqual({
        symbol: 'unknown',
        name: 'unknown',
        decimals: 9
      });
    });
  });

  describe('batchGetTokenMetadata', () => {
    it('returns empty object for invalid inputs', async () => {
      expect(await batchGetTokenMetadata(null)).toEqual({});
      expect(await batchGetTokenMetadata(undefined)).toEqual({});
      expect(await batchGetTokenMetadata([])).toEqual({});
      expect(await batchGetTokenMetadata('not-an-array')).toEqual({});
    });

    it('returns placeholders when API fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API error'));
      
      const tokens = ['token1', 'token2'];
      const result = await batchGetTokenMetadata(tokens);
      
      expect(result).toEqual({
        token1: {
          symbol: 'toke...ken1',
          name: 'toke...ken1',
          decimals: 9
        },
        token2: {
          symbol: 'toke...ken2',
          name: 'toke...ken2',
          decimals: 9
        }
      });
    });
  });

  describe('calculatePriceFromSqrtPrice', () => {
    it('returns 0 for invalid inputs', () => {
      expect(calculatePriceFromSqrtPrice(null)).toBe(0);
      expect(calculatePriceFromSqrtPrice(undefined)).toBe(0);
      expect(calculatePriceFromSqrtPrice(123)).toBe(0);
      expect(calculatePriceFromSqrtPrice({})).toBe(0);
    });

    it('calculates price correctly with default decimals', () => {
      // sqrt_price = 1000000 (1.0 in X64 fixed point)
      const result = calculatePriceFromSqrtPrice('1000000');
      expect(result).toBeCloseTo(1.0, 6);
    });

    it('adjusts price for different token decimals', () => {
      const result = calculatePriceFromSqrtPrice('1000000', 9, 6);
      expect(result).toBeCloseTo(0.001, 6);
    });
  });

  describe('enhancePoolWithTokenMetadata', () => {
    it('returns original pool for invalid inputs', async () => {
      const invalidPool = { foo: 'bar' };
      expect(await enhancePoolWithTokenMetadata(null)).toBe(null);
      expect(await enhancePoolWithTokenMetadata(undefined)).toBe(undefined);
      expect(await enhancePoolWithTokenMetadata(invalidPool)).toEqual(invalidPool);
    });

    it('enhances pool with placeholders when API fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API error'));
      
      const pool = {
        token_a_mint: 'tokenA',
        token_b_mint: 'tokenB',
        sqrt_price: '1000000'
      };
      
      const result = await enhancePoolWithTokenMetadata(pool);
      
      expect(result).toEqual({
        ...pool,
        tokenA: {
          symbol: 'toke...kenA',
          name: 'toke...kenA',
          decimals: 9
        },
        tokenB: {
          symbol: 'toke...kenB',
          name: 'toke...kenB',
          decimals: 9
        },
        currentPrice: expect.any(Number)
      });
    });
  });
}); 