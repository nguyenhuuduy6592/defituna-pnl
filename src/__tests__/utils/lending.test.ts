import {
  transformApiVaultData,
  getCachedData,
  setCachedData,
  fetchWithValidation,
  API_ENDPOINTS,
  vaultDataSchema,
  tokenInfoSchema,
  priceDataSchema,
  CACHE_TTL
} from 'src/utils/api/lending';
import { z } from 'zod';

describe('lending.ts', () => {
  describe('transformApiVaultData', () => {
    it('transforms API vault data correctly', () => {
      const apiVault = {
        address: 'addr',
        mint: 'mint',
        deposited_funds: { amount: '100', usd: 200 },
        borrowed_funds: { amount: '50', usd: 100 },
        supply_limit: { amount: '1000', usd: 2000 },
        utilization: 0.5,
        supply_apy: 0.1,
        borrow_apy: 0.2,
        borrowed_shares: '10',
        deposited_shares: '20',
        pyth_oracle_feed_id: 'feed',
        pyth_oracle_price_update: 'update',
      };
      const result = transformApiVaultData(apiVault);
      expect(result).toMatchObject({
        address: 'addr',
        mint: 'mint',
        depositedFunds: { amount: '100', usdValue: 200 },
        borrowedFunds: { amount: '50', usdValue: 100 },
        supplyLimit: { amount: '1000', usdValue: 2000 },
        utilization: 0.5,
        supplyApy: 0.1,
        borrowApy: 0.2,
        borrowedShares: '10',
        depositedShares: '20',
        pythOracleFeedId: 'feed',
        pythOraclePriceUpdate: 'update',
      });
    });
    it('ignores extra fields and does not add tokenMeta/age', () => {
      const apiVault = {
        address: 'addr',
        mint: 'mint',
        deposited_funds: { amount: '100', usd: 200 },
        borrowed_funds: { amount: '50', usd: 100 },
        supply_limit: { amount: '1000', usd: 2000 },
        utilization: 0.5,
        supply_apy: 0.1,
        borrow_apy: 0.2,
        borrowed_shares: '10',
        deposited_shares: '20',
        pyth_oracle_feed_id: 'feed',
        pyth_oracle_price_update: 'update',
        extra: 'ignore',
        tokenMeta: { mint: 'x' },
        age: 123,
      };
      const result = transformApiVaultData(apiVault);
      expect(result.tokenMeta).toBeUndefined();
      expect(result.age).toBeUndefined();
    });
  });

  describe('getCachedData/setCachedData', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it('sets and gets cache within TTL', () => {
      setCachedData('key', { foo: 1 });
      expect(getCachedData('key', 1000)).toEqual({ foo: 1 });
    });
    it('returns null after TTL expires', () => {
      setCachedData('key2', { bar: 2 });
      jest.advanceTimersByTime(2001);
      expect(getCachedData('key2', 2000)).toBeNull();
    });
    it('returns null if not set', () => {
      expect(getCachedData('nope', 1000)).toBeNull();
    });
  });

  describe('fetchWithValidation', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('fetches and validates data', async () => {
      const schema = z.object({ foo: z.string() });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ foo: 'bar' })
      });
      const result = await fetchWithValidation('url', schema);
      expect(result).toEqual({ foo: 'bar' });
    });
    it('throws on HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });
      await expect(fetchWithValidation('url', z.any())).rejects.toThrow('HTTP error');
    });
    it('throws on schema validation error', async () => {
      const schema = z.object({ foo: z.string() });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ foo: 123 }) });
      await expect(fetchWithValidation('url', schema)).rejects.toThrow();
    });
  });

  describe('API_ENDPOINTS', () => {
    it('generates correct URLs', () => {
      expect(API_ENDPOINTS.VAULTS).toMatch(/vaults/);
      expect(API_ENDPOINTS.TOKEN_INFO('mint')).toMatch(/mints\/mint/);
      expect(API_ENDPOINTS.PRICE_DATA('mint')).toMatch(/oracle-prices\/mint/);
    });
  });

  describe('schemas', () => {
    it('validates vaultDataSchema', () => {
      const valid = {
        address: 'a',
        mint: 'b',
        deposited_funds: { amount: '1', usd: 2 },
        borrowed_funds: { amount: '1', usd: 2 },
        supply_limit: { amount: '1', usd: 2 },
        utilization: 0.1,
        supply_apy: 0.2,
        borrow_apy: 0.3,
        borrowed_shares: 'x',
        deposited_shares: 'y',
        pyth_oracle_feed_id: 'z',
        pyth_oracle_price_update: 'w',
      };
      expect(() => vaultDataSchema.parse(valid)).not.toThrow();
      expect(() => vaultDataSchema.parse({ ...valid, address: 1 })).toThrow();
    });
    it('validates tokenInfoSchema', () => {
      const valid = { mint: 'a', symbol: 'b', logo: 'c', decimals: 6 };
      expect(() => tokenInfoSchema.parse(valid)).not.toThrow();
      expect(() => tokenInfoSchema.parse({ ...valid, decimals: -1 })).toThrow();
    });
    it('validates priceDataSchema', () => {
      const valid = { mint: 'a', price: 1, decimals: 6, timestamp: 123 };
      expect(() => priceDataSchema.parse(valid)).not.toThrow();
      expect(() => priceDataSchema.parse({ ...valid, price: -1 })).toThrow();
    });
  });

  describe('CACHE_TTL', () => {
    it('has expected values', () => {
      expect(CACHE_TTL.VAULTS).toBe(30000);
      expect(CACHE_TTL.TOKEN_METADATA).toBe(24 * 60 * 60 * 1000);
      expect(CACHE_TTL.PRICE_DATA).toBe(2 * 60 * 1000);
    });
  });
}); 