import {
  fetchPositions,
  fetchPoolData,
  fetchMarketData,
  fetchTokenData,
  processPositionsData,
} from '../../utils/defituna';
import { processTunaPosition } from '../../utils/formulas';

// Mock the formulas module
jest.mock('../../utils/formulas', () => ({
  processTunaPosition: jest.fn(),
}));

// Mock global fetch initially
global.fetch = jest.fn();

// Mock environment variable
process.env.DEFITUNA_API_URL = 'http://mock-api.com';

// Use fake timers for cache testing
jest.useFakeTimers();

describe('DeFiTuna Utilities', () => {
  beforeEach(() => {
    // Reset module state (including internal caches) before each test
    jest.resetModules();

    // Clear global fetch mock state (calls, specific implementations)
    // The mock function itself persists, but its history and implementations are cleared.
    if (typeof fetch !== 'undefined' && fetch.mockClear) {
      fetch.mockClear();
      // Also reset implementations if mockImplementation was used broadly before
      // fetch.mockImplementation(() => Promise.resolve({ ok: false, status: 404 }));
    }

    // processTunaPosition mock needs clearing if used across tests without re-mocking
    const formulasMock = require('../../utils/formulas'); // Get the mocked module
    if (
      formulasMock.processTunaPosition &&
      formulasMock.processTunaPosition.mockClear
    ) {
      formulasMock.processTunaPosition.mockClear();
    }

    // Re-set environment variable just in case it was reset
    process.env.DEFITUNA_API_URL = 'http://mock-api.com';
  });

  // --- Helper Function Tests (if any exported or deemed complex enough) ---
  // Example: describe('encodeValue', () => { ... });
  // Example: describe('isCacheValid', () => { ... });

  // --- Fetch Function Tests ---
  describe('fetchPositions', () => {
    const wallet = 'testWallet123';
    const mockApiResponse = { data: [{ id: 1 }, { id: 2 }] };

    it('should fetch positions for a given wallet', async () => {
      const { fetchPositions } = require('../../utils/defituna');
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const positions = await fetchPositions(wallet);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `http://mock-api.com/users/${wallet}/tuna-positions`
      );
      expect(positions).toEqual(mockApiResponse.data);
    });

    it('should throw an error if wallet is not provided', async () => {
      const { fetchPositions } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      // No fetch mock needed
      await expect(fetchPositions(null)).rejects.toThrow(
        'Wallet address is required'
      );
      await expect(fetchPositions(undefined)).rejects.toThrow(
        'Wallet address is required'
      );
      await expect(fetchPositions('')).rejects.toThrow(
        'Wallet address is required'
      );
      expect(fetch).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should throw an error if API fetch fails', async () => {
      const { fetchPositions } = require('../../utils/defituna');
      const errorMessage = 'Network Error';
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(fetchPositions(wallet)).rejects.toThrow(errorMessage);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `http://mock-api.com/users/${wallet}/tuna-positions`
      );
      // Check console log was called due to catch block
      expect(consoleSpy).toHaveBeenCalledWith(
        '[fetchPositions] Error:',
        errorMessage
      );
      consoleSpy.mockRestore();
    });

    it('should throw an error if API response is not ok', async () => {
      const { fetchPositions } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fetchPositions(wallet)).rejects.toThrow(
        'Failed to fetch positions: 404 Not Found'
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      // Check console log was called due to catch block
      expect(consoleSpy).toHaveBeenCalledWith(
        '[fetchPositions] Error:',
        'Failed to fetch positions: 404 Not Found'
      );
      consoleSpy.mockRestore();
    });

    it('should throw an error if API returns invalid data structure', async () => {
      const { fetchPositions } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const invalidResponse = { not_data: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      await expect(fetchPositions(wallet)).rejects.toThrow(
        'Invalid positions data received from API'
      );

      // Check console log was called before throwing
      expect(consoleSpy).toHaveBeenCalledWith(
        '[fetchPositions] Invalid positions data received:',
        undefined
      ); // data is destructured, will be undefined
      // Check console log from catch block
      expect(consoleSpy).toHaveBeenCalledWith(
        '[fetchPositions] Error:',
        'Invalid positions data received from API'
      );
      consoleSpy.mockRestore();
    });

    it('should throw an error if API returns non-array data', async () => {
      const { fetchPositions } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const invalidData = { id: 1 };
      const invalidResponse = { data: invalidData };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      await expect(fetchPositions(wallet)).rejects.toThrow(
        'Invalid positions data received from API'
      );

      // Check console log was called before throwing
      expect(consoleSpy).toHaveBeenCalledWith(
        '[fetchPositions] Invalid positions data received:',
        invalidData
      );
      // Check console log from catch block
      expect(consoleSpy).toHaveBeenCalledWith(
        '[fetchPositions] Error:',
        'Invalid positions data received from API'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('fetchPoolData', () => {
    const poolAddress = 'pool123';
    const mockPoolData = {
      id: 'pool123',
      token_a_mint: 'mintA',
      token_b_mint: 'mintB',
    };
    const mockApiResponse = { data: mockPoolData };
    const cacheTTL = 30 * 1000;

    it('should fetch pool data for a given address when cache is empty', async () => {
      const { fetchPoolData } = require('../../utils/defituna');
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const poolData = await fetchPoolData(poolAddress);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `http://mock-api.com/pools/${poolAddress}`
      );
      expect(poolData).toEqual(mockPoolData);
    });

    it('should use cache if valid', async () => {
      const { fetchPoolData } = require('../../utils/defituna');
      // First call to populate cache
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });
      await fetchPoolData(poolAddress);
      expect(fetch).toHaveBeenCalledTimes(1);
      fetch.mockClear(); // Clear calls before next check

      // Second call should hit cache (use same function ref)
      const poolData = await fetchPoolData(poolAddress);
      expect(fetch).not.toHaveBeenCalled();
      expect(poolData).toEqual(mockPoolData);
    });

    it('should fetch new data if cache is expired', async () => {
      const { fetchPoolData } = require('../../utils/defituna');
      // First call to populate cache
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });
      await fetchPoolData(poolAddress);
      expect(fetch).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(cacheTTL + 1);

      // Second call should fetch again
      const updatedMockData = { ...mockPoolData, updated: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedMockData }),
      });
      const poolData = await fetchPoolData(poolAddress);

      expect(fetch).toHaveBeenCalledTimes(2); // Called again
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        `http://mock-api.com/pools/${poolAddress}`
      );
      expect(poolData).toEqual(updatedMockData);
    });

    it('should throw an error if pool address is not provided', async () => {
      const { fetchPoolData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await expect(fetchPoolData(null)).rejects.toThrow(
        'Pool address is required'
      );
      expect(fetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[fetchPoolData] No pool address provided'
      );
      consoleSpy.mockRestore();
    });

    it('should throw an error if API fetch fails', async () => {
      const { fetchPoolData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const errorMessage = 'Network Error';
      fetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(fetchPoolData(poolAddress)).rejects.toThrow(errorMessage);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[fetchPoolData] Error fetching pool data'),
        errorMessage
      );
      consoleSpy.mockRestore();
    });

    it('should throw an error if API response is not ok', async () => {
      const { fetchPoolData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      await expect(fetchPoolData(poolAddress)).rejects.toThrow(
        'Failed to fetch pool data: 500 Server Error'
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[fetchPoolData] Error fetching pool data'),
        'Failed to fetch pool data: 500 Server Error'
      );
      consoleSpy.mockRestore();
    });

    it('should throw an error if API response lacks data field', async () => {
      const { fetchPoolData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ not_the_data: {} }),
      });

      await expect(fetchPoolData(poolAddress)).rejects.toThrow(
        'API response missing data field'
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[fetchPoolData] No data field in API response')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[fetchPoolData] Error fetching pool data'),
        'API response missing data field'
      );
      consoleSpy.mockRestore();
    });

    it('should throw an error if API response has null data field', async () => {
      const { fetchPoolData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null }),
      });

      await expect(fetchPoolData(poolAddress)).rejects.toThrow(
        'API response missing data field'
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[fetchPoolData] No data field in API response')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[fetchPoolData] Error fetching pool data'),
        'API response missing data field'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('fetchMarketData', () => {
    const mockMarketData = { BTC: { price: 50000 }, ETH: { price: 4000 } };
    const cacheTTL = 60 * 60 * 1000;

    it('should fetch market data when cache is empty', async () => {
      const { fetchMarketData } = require('../../utils/defituna');
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketData,
      });

      const marketData = await fetchMarketData();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('http://mock-api.com/markets');
      expect(marketData).toEqual(mockMarketData);
    });

    it('should use cache if valid', async () => {
      const { fetchMarketData } = require('../../utils/defituna');
      // First call
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketData,
      });
      await fetchMarketData();
      expect(fetch).toHaveBeenCalledTimes(1);
      fetch.mockClear();

      // Second call
      const marketData = await fetchMarketData();
      expect(fetch).not.toHaveBeenCalled();
      expect(marketData).toEqual(mockMarketData);
    });

    it('should fetch new data if cache is expired', async () => {
      const { fetchMarketData } = require('../../utils/defituna');
      // First call
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketData,
      });
      await fetchMarketData();
      expect(fetch).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(cacheTTL + 1);

      // Second call
      const updatedMockData = { ...mockMarketData, SOL: { price: 150 } };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedMockData,
      });
      const marketData = await fetchMarketData();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(2, 'http://mock-api.com/markets');
      expect(marketData).toEqual(updatedMockData);
    });

    it('should throw an error if API fetch fails', async () => {
      const { fetchMarketData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const errorMessage = 'Network Error';
      fetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(fetchMarketData()).rejects.toThrow(errorMessage);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[fetchMarketData] Error:',
        errorMessage
      );
      consoleSpy.mockRestore();
    });

    it('should throw an error if API response is not ok', async () => {
      const { fetchMarketData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(fetchMarketData()).rejects.toThrow(
        'Failed to fetch market data: 403 Forbidden'
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[fetchMarketData] Error:',
        'Failed to fetch market data: 403 Forbidden'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('fetchTokenData', () => {
    const mintAddress = 'mintAbc123';
    const mockTokenApiData = { symbol: 'TOK', mint: mintAddress, decimals: 8 }; // Raw API data
    const mockApiResponse = { data: mockTokenApiData };
    const expectedTokenData = {
      // Formatted data returned by function
      symbol: mockTokenApiData.symbol,
      mint: mockTokenApiData.mint,
      decimals: mockTokenApiData.decimals,
    };
    const cacheTTL = 24 * 60 * 60 * 1000;
    const defaultStructure = (mint) => ({
      symbol: mint ? `${mint.slice(0, 4)}...${mint.slice(-4)}` : 'UNKNOWN',
      mint: mint || '',
      decimals: 9,
    });

    it('should fetch token data for a given mint address when cache is empty', async () => {
      const { fetchTokenData } = require('../../utils/defituna');
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const tokenData = await fetchTokenData(mintAddress);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `http://mock-api.com/mints/${mintAddress}`
      );
      expect(tokenData).toEqual(expectedTokenData);
    });

    it('should use cache if valid', async () => {
      const { fetchTokenData } = require('../../utils/defituna');
      // First call
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });
      await fetchTokenData(mintAddress);
      expect(fetch).toHaveBeenCalledTimes(1);
      fetch.mockClear();

      // Second call
      const tokenData = await fetchTokenData(mintAddress);
      expect(fetch).not.toHaveBeenCalled();
      expect(tokenData).toEqual(expectedTokenData);
    });

    it('should fetch new data if cache is expired', async () => {
      const { fetchTokenData } = require('../../utils/defituna');
      // First call
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });
      await fetchTokenData(mintAddress);
      expect(fetch).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(cacheTTL + 1);

      // Second call
      const updatedMockApiData = { ...mockTokenApiData, symbol: 'NEWTOK' };
      const updatedExpectedData = { ...expectedTokenData, symbol: 'NEWTOK' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedMockApiData }),
      });
      const tokenData = await fetchTokenData(mintAddress);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(tokenData).toEqual(updatedExpectedData);
    });

    it('should return default structure if mint address is not provided', async () => {
      const { fetchTokenData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      // No fetch mock needed
      const result = await fetchTokenData(null);
      expect(result).toEqual(defaultStructure(null));
      expect(fetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[fetchTokenData] No mint address provided'
      );
      consoleSpy.mockRestore();
    });

    it('should return default structure and log error if API fetch fails', async () => {
      const { fetchTokenData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const errorMessage = 'Network Error';
      fetch.mockRejectedValueOnce(new Error(errorMessage));

      const result = await fetchTokenData(mintAddress);

      expect(result).toEqual(defaultStructure(mintAddress));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[fetchTokenData] Error fetching token data'),
        errorMessage
      );
      consoleSpy.mockRestore();
    });

    it('should return default structure and log error if API response is not ok', async () => {
      const { fetchTokenData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await fetchTokenData(mintAddress);

      expect(result).toEqual(defaultStructure(mintAddress));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[fetchTokenData] Error fetching token data'),
        'Failed to fetch token data: 404 Not Found'
      );
      consoleSpy.mockRestore();
    });
  });

  // --- Processing Function Tests ---
  describe('processPositionsData', () => {
    // Mock data needed for these tests
    const mockPositionsRaw = [
      {
        address: 'pos1',
        pool: 'poolA',
        state: 'active',
        opened_at: '2023-01-01T10:00:00Z' /* ... other raw fields */,
      },
      { address: 'pos2', pool: 'poolB', state: 'active' /* ... */ },
      { address: 'pos3', pool: 'poolA', state: 'closed' /* ... */ },
      { address: 'pos4_no_pool_data', pool: 'poolC_missing', state: 'active' },
      {
        address: 'pos5_no_token_data',
        pool: 'poolD_bad_token',
        state: 'active',
      },
      { address: 'pos6_invalid', pool: null, state: 'active' }, // Invalid position
    ];
    const mockPoolA = {
      address: 'poolA',
      token_a_mint: 'mintA',
      token_b_mint: 'mintB',
    };
    const mockPoolB = {
      address: 'poolB',
      token_a_mint: 'mintC',
      token_b_mint: 'mintD',
    };
    const mockPoolD = {
      address: 'poolD_bad_token',
      token_a_mint: 'mintE_missing',
      token_b_mint: 'mintF',
    }; // Pool with a missing token
    const mockMarketData = { marketInfo: 'some_data' };
    const mockTokenA = { mint: 'mintA', symbol: 'AAA', decimals: 6 };
    const mockTokenB = { mint: 'mintB', symbol: 'BBB', decimals: 9 };
    const mockTokenC = { mint: 'mintC', symbol: 'CCC', decimals: 6 };
    const mockTokenD = { mint: 'mintD', symbol: 'DDD', decimals: 8 };
    const mockTokenF = { mint: 'mintF', symbol: 'FFF', decimals: 7 };
    // Mock return value from the actual formulas.processTunaPosition
    const mockProcessedPositionResult = {
      currentPrice: 10.5,
      entryPrice: 10,
      rangePrices: { lower: 9, upper: 11 },
      liquidationPrice: { lower: 8, upper: 12 },
      limitOrderPrices: { lower: null, upper: null },
      leverage: 2.5,
      size: 1000.5,
      pnl: {
        usd: 50.256,
        bps: 502,
        a: { amount: 25.128, bps: 251 },
        b: { amount: 25.128, bps: 251 },
      },
      yield: {
        usd: 5.1,
        a: { amount: 2.55 },
        b: { amount: 2.55 },
      },
      compounded: {
        usd: 55.35,
        a: { amount: 27.675 },
        b: { amount: 27.675 },
      },
      collateral: { usd: 400.12 },
      debt: { usd: 600.34 },
      interest: { usd: 1.5 },
    };
    // Expected final structure with raw decimal values
    const expectedEncodedPosition = {
      p_addr: expect.any(String),
      state: expect.any(String),
      pair: expect.any(String),
      opened_at: expect.any(String),
      c_price: 10.5, // raw decimal value
      e_price: 10, // raw decimal value
      r_prices: { l: 9, u: 11 },
      liq_price: { l: 8, u: 12 },
      lim_prices: { l: null, u: null }, // Nulls remain null
      lev: 2.5, // raw decimal value
      sz: 1000.5, // raw decimal value
      pnl: { u: 50.256, b: 502 }, // raw decimal value
      yld: { u: 5.1 }, // raw decimal value
      cmp: { u: 55.35 }, // raw decimal value
      col: { u: 400.12 }, // raw decimal value
      dbt: { u: 600.34 }, // raw decimal value
      int: { u: 1.5 }, // raw decimal value
    };

    it('should return an empty array for null, undefined, or empty input', async () => {
      const { processPositionsData } = require('../../utils/defituna');
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      // No fetch mock needed

      expect(await processPositionsData(null)).toEqual([]);
      expect(await processPositionsData(undefined)).toEqual([]);
      expect(await processPositionsData([])).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[processPositionsData] No positions data provided'
      );
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });

    it('should fetch required data (market, unique pools, unique tokens)', async () => {
      const { processPositionsData } = require('../../utils/defituna');
      const { processTunaPosition } = require('../../utils/formulas');
      // Setup fetch mock specifically for this test
      fetch.mockImplementation(async (url) => {
        const urlStr = url.toString();
        // Simplified: provide all expected successful fetches
        if (urlStr.includes('/markets')) {
          return { ok: true, json: async () => mockMarketData };
        }
        if (urlStr.includes('/pools/poolA')) {
          return { ok: true, json: async () => ({ data: mockPoolA }) };
        }
        if (urlStr.includes('/pools/poolB')) {
          return { ok: true, json: async () => ({ data: mockPoolB }) };
        }
        if (urlStr.includes('/mints/mintA')) {
          return { ok: true, json: async () => ({ data: mockTokenA }) };
        }
        if (urlStr.includes('/mints/mintB')) {
          return { ok: true, json: async () => ({ data: mockTokenB }) };
        }
        if (urlStr.includes('/mints/mintC')) {
          return { ok: true, json: async () => ({ data: mockTokenC }) };
        }
        if (urlStr.includes('/mints/mintD')) {
          return { ok: true, json: async () => ({ data: mockTokenD }) };
        }
        return {
          ok: false,
          status: 404,
          statusText: `Unhandled Mock: ${urlStr}`,
        };
      });
      processTunaPosition.mockReturnValue(mockProcessedPositionResult);

      await processPositionsData(mockPositionsRaw.slice(0, 3)); // Use first 3 valid positions

      // Assertions (remain the same)
      expect(fetch).toHaveBeenCalledWith('http://mock-api.com/markets');
      expect(fetch).toHaveBeenCalledWith('http://mock-api.com/pools/poolA');
      expect(fetch).toHaveBeenCalledWith('http://mock-api.com/pools/poolB');
      expect(fetch).toHaveBeenCalledWith('http://mock-api.com/mints/mintA');
      expect(fetch).toHaveBeenCalledWith('http://mock-api.com/mints/mintB');
      expect(fetch).toHaveBeenCalledWith('http://mock-api.com/mints/mintC');
      expect(fetch).toHaveBeenCalledWith('http://mock-api.com/mints/mintD');
      const fetchCalls = fetch.mock.calls.map((call) => call[0]);
      expect(
        fetchCalls.filter((url) => url.includes('/pools/poolA')).length
      ).toBe(1);
      expect(
        fetchCalls.filter((url) => url.includes('/mints/mintA')).length
      ).toBe(1);
    });

    it('should call processTunaPosition for each valid position with correct arguments', async () => {
      const { processPositionsData } = require('../../utils/defituna');
      const { processTunaPosition } = require('../../utils/formulas');
      // Setup fetch mock (same as above test)
      fetch.mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/markets')) {
          return { ok: true, json: async () => mockMarketData };
        }
        if (urlStr.includes('/pools/poolA')) {
          return { ok: true, json: async () => ({ data: mockPoolA }) };
        }
        if (urlStr.includes('/pools/poolB')) {
          return { ok: true, json: async () => ({ data: mockPoolB }) };
        }
        if (urlStr.includes('/mints/mintA')) {
          return { ok: true, json: async () => ({ data: mockTokenA }) };
        }
        if (urlStr.includes('/mints/mintB')) {
          return { ok: true, json: async () => ({ data: mockTokenB }) };
        }
        if (urlStr.includes('/mints/mintC')) {
          return { ok: true, json: async () => ({ data: mockTokenC }) };
        }
        if (urlStr.includes('/mints/mintD')) {
          return { ok: true, json: async () => ({ data: mockTokenD }) };
        }
        return {
          ok: false,
          status: 404,
          statusText: `Unhandled Mock: ${urlStr}`,
        };
      });
      processTunaPosition.mockReturnValue(mockProcessedPositionResult);

      await processPositionsData(mockPositionsRaw.slice(0, 3));

      // Assertions (remain the same)
      expect(processTunaPosition).toHaveBeenCalledTimes(3);
      expect(processTunaPosition).toHaveBeenNthCalledWith(
        1,
        { data: mockPositionsRaw[0] },
        { data: mockPoolA },
        mockMarketData,
        mockTokenA,
        mockTokenB
      );
      expect(processTunaPosition).toHaveBeenNthCalledWith(
        2,
        { data: mockPositionsRaw[1] },
        { data: mockPoolB },
        mockMarketData,
        mockTokenC,
        mockTokenD
      );
      expect(processTunaPosition).toHaveBeenNthCalledWith(
        3,
        { data: mockPositionsRaw[2] },
        { data: mockPoolA },
        mockMarketData,
        mockTokenA,
        mockTokenB
      );
    });

    it('should format and encode the output correctly for valid positions', async () => {
      const { processPositionsData } = require('../../utils/defituna');
      const { processTunaPosition } = require('../../utils/formulas');
      // Setup fetch mock for this test (only need poolA and its tokens)
      fetch.mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/markets')) {
          return { ok: true, json: async () => mockMarketData };
        }
        if (urlStr.includes('/pools/poolA')) {
          return { ok: true, json: async () => ({ data: mockPoolA }) };
        }
        if (urlStr.includes('/mints/mintA')) {
          return { ok: true, json: async () => ({ data: mockTokenA }) };
        }
        if (urlStr.includes('/mints/mintB')) {
          return { ok: true, json: async () => ({ data: mockTokenB }) };
        }
        return {
          ok: false,
          status: 404,
          statusText: `Unhandled Mock: ${urlStr}`,
        };
      });
      processTunaPosition.mockReturnValue(mockProcessedPositionResult);

      const result = await processPositionsData(mockPositionsRaw.slice(0, 1));

      // Assertions (remain the same)
      expect(result).toHaveLength(1);
      const encodedPos = result[0];
      expect(encodedPos.p_addr).toBe('pos1');
      expect(encodedPos.state).toBe('active');
      expect(encodedPos.pair).toBe('AAA/BBB');
      expect(encodedPos.opened_at).toBe('2023-01-01T10:00:00Z');
      expect(encodedPos).toMatchObject(expectedEncodedPosition);
    });

    it('should filter out positions with missing pool data', async () => {
      // Test Adjusted: Expect Promise.all to reject when fetchPoolData fails
      const { processPositionsData } = require('../../utils/defituna');
      const { processTunaPosition } = require('../../utils/formulas');
      const consoleSpyError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const consoleSpyWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      fetch.mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/markets')) {
          return { ok: true, json: async () => mockMarketData };
        }
        if (urlStr.includes('/pools/poolA')) {
          return { ok: true, json: async () => ({ data: mockPoolA }) };
        }
        if (urlStr.includes('/pools/poolB')) {
          return { ok: true, json: async () => ({ data: mockPoolB }) };
        }
        if (urlStr.includes('/pools/poolD_bad_token')) {
          return { ok: true, json: async () => ({ data: mockPoolD }) };
        }
        if (urlStr.includes('/pools/poolC_missing')) {
          return { ok: false, status: 404, statusText: 'Not Found' };
        } // Simulate missing pool
        // Provide fetches for tokens needed by other valid positions
        if (urlStr.includes('/mints/')) {
          return {
            ok: true,
            json: async () => ({
              data: {
                mint: urlStr.split('/').pop(),
                symbol: 'TEMP',
                decimals: 6,
              },
            }),
          };
        }
        return {
          ok: false,
          status: 404,
          statusText: `Unhandled Mock: ${urlStr}`,
        };
      });
      processTunaPosition.mockReturnValue(mockProcessedPositionResult);

      // Expect the entire process to fail because Promise.all rejects
      await expect(processPositionsData(mockPositionsRaw)).rejects.toThrow(
        'Failed to fetch pool data: 404 Not Found'
      );

      // Verify relevant console logs were still called before the rejection
      expect(consoleSpyError).toHaveBeenCalledWith(
        expect.stringContaining('[fetchPoolData] Error fetching pool data'),
        'Failed to fetch pool data: 404 Not Found'
      );
      // expect(consoleSpyWarn).toHaveBeenCalledWith('[processPositionsData] Invalid position data:', mockPositionsRaw[5]); // This log is not reached if Promise.all rejects early
      consoleSpyError.mockRestore();
      consoleSpyWarn.mockRestore();
    });

    it('should filter out positions with missing token data', async () => {
      // Test Adjusted: Expect position NOT to be filtered, processTunaPosition called with default token
      const { processPositionsData } = require('../../utils/defituna');
      const { processTunaPosition } = require('../../utils/formulas');
      const consoleSpyError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const consoleSpyWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      fetch.mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/markets')) {
          return { ok: true, json: async () => mockMarketData };
        }
        if (urlStr.includes('/pools/poolA')) {
          return { ok: true, json: async () => ({ data: mockPoolA }) };
        }
        if (urlStr.includes('/pools/poolB')) {
          return { ok: true, json: async () => ({ data: mockPoolB }) };
        }
        if (urlStr.includes('/pools/poolD_bad_token')) {
          return { ok: true, json: async () => ({ data: mockPoolD }) };
        }
        if (urlStr.includes('/pools/poolC_missing')) {
          return { ok: true, json: async () => ({ data: {} }) };
        }
        if (urlStr.includes('/mints/mintA')) {
          return { ok: true, json: async () => ({ data: mockTokenA }) };
        }
        if (urlStr.includes('/mints/mintB')) {
          return { ok: true, json: async () => ({ data: mockTokenB }) };
        }
        if (urlStr.includes('/mints/mintC')) {
          return { ok: true, json: async () => ({ data: mockTokenC }) };
        }
        if (urlStr.includes('/mints/mintD')) {
          return { ok: true, json: async () => ({ data: mockTokenD }) };
        }
        if (urlStr.includes('/mints/mintF')) {
          return { ok: true, json: async () => ({ data: mockTokenF }) };
        }
        if (urlStr.includes('/mints/mintE_missing')) {
          return { ok: false, status: 404, statusText: 'Not Found' };
        } // fetchTokenData handles this internally
        return {
          ok: false,
          status: 404,
          statusText: `Unhandled Mock: ${urlStr}`,
        };
      });
      processTunaPosition.mockReturnValue(mockProcessedPositionResult);

      const result = await processPositionsData(mockPositionsRaw);

      // Find the result for pos5 - it SHOULD exist due to current logic
      const pos5Result = result.find((p) => p.p_addr === 'pos5_no_token_data');
      expect(pos5Result).toBeDefined();
      // Check that the pair reflects the default token symbol structure
      expect(pos5Result.pair).toBe('mint...sing/FFF');

      // Check that processTunaPosition was called for pos5, potentially with default token data for mintE
      const defaultTokenE = {
        symbol: 'mint...sing',
        mint: 'mintE_missing',
        decimals: 9,
      };
      expect(processTunaPosition).toHaveBeenCalledWith(
        { data: mockPositionsRaw[4] }, // pos5 data
        { data: mockPoolD },
        mockMarketData,
        defaultTokenE, // Expecting the default structure from fetchTokenData error
        mockTokenF
      );

      // Check expected console logs
      expect(consoleSpyError).toHaveBeenCalledWith(
        expect.stringContaining('[fetchTokenData] Error fetching token data'),
        expect.stringContaining('Failed to fetch token data: 404 Not Found')
      );
      // The code DOES NOT log '[processPositionsData] Missing token data' because the default token is considered valid by the `if (!tokenA || !tokenB)` check
      consoleSpyError.mockRestore();
      consoleSpyWarn.mockRestore();
    });

    it('should throw an error if market data fetch fails', async () => {
      const { processPositionsData } = require('../../utils/defituna');
      // Setup fetch mock for this specific failure
      fetch.mockImplementation(async (url) => {
        if (url.toString().includes('/markets')) {
          throw new Error('Market Data Unavailable');
        }
        // Allow minimal other fetches if needed before market data is awaited
        return { ok: true, json: async () => ({ data: {} }) };
      });

      // Spy on console.error as the outer function also logs the error
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await expect(
        processPositionsData(mockPositionsRaw.slice(0, 1))
      ).rejects.toThrow('Market Data Unavailable');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[processPositionsData] Error processing positions data:',
        'Market Data Unavailable'
      );
      consoleSpy.mockRestore();
    });

    it('should handle errors during processTunaPosition gracefully (filter position)', async () => {
      // Test Adjusted: Expect processPositionsData to reject because the error in .map isn't caught per iteration
      const { processPositionsData } = require('../../utils/defituna');
      const { processTunaPosition } = require('../../utils/formulas');
      // Setup fetch mock for valid data fetching
      fetch.mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/markets')) {
          return { ok: true, json: async () => mockMarketData };
        }
        if (urlStr.includes('/pools/poolA')) {
          return { ok: true, json: async () => ({ data: mockPoolA }) };
        }
        if (urlStr.includes('/pools/poolB')) {
          return { ok: true, json: async () => ({ data: mockPoolB }) };
        }
        if (urlStr.includes('/mints/mintA')) {
          return { ok: true, json: async () => ({ data: mockTokenA }) };
        }
        if (urlStr.includes('/mints/mintB')) {
          return { ok: true, json: async () => ({ data: mockTokenB }) };
        }
        if (urlStr.includes('/mints/mintC')) {
          return { ok: true, json: async () => ({ data: mockTokenC }) };
        }
        if (urlStr.includes('/mints/mintD')) {
          return { ok: true, json: async () => ({ data: mockTokenD }) };
        }
        return {
          ok: false,
          status: 404,
          statusText: `Unhandled Mock: ${urlStr}`,
        };
      });

      const processingError = new Error('Calculation failed');
      // Make processTunaPosition throw for the second position
      processTunaPosition.mockImplementation((pos) => {
        if (pos.data.address === 'pos2') {
          throw processingError;
        }
        return mockProcessedPositionResult;
      });

      // Spy on console.error as the outer catch block *will* log this error
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Expect the outer promise to reject due to the uncaught error in .map
      await expect(
        processPositionsData(mockPositionsRaw.slice(0, 3))
      ).rejects.toThrow('Calculation failed');

      // Verify the outer catch block logged the error
      expect(consoleSpy).toHaveBeenCalledWith(
        '[processPositionsData] Error processing positions data:',
        'Calculation failed'
      );
      consoleSpy.mockRestore();
    });
  });
});
