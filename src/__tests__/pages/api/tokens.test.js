import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/tokens';

// Mock the global fetch
global.fetch = jest.fn();

// Mock console.error
global.console = {
  ...global.console,
  error: jest.fn(),
};

// Set the environment variable for the API URL
const MOCK_API_URL = 'http://mock-defituna-api.com';
process.env.DEFITUNA_API_URL = MOCK_API_URL;

describe('tokens API Handler (/api/tokens)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock successful fetch
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        data: [
          { mint: 'mint1', symbol: 'SYM1', decimals: 6 },
          { mint: 'mint2', symbol: 'SYM2' }, // Missing decimals, should default
          { mint: 'mint3', symbol: 'SYM3', decimals: 9 },
        ]
      }),
    });
  });

  it('should fetch token metadata, transform it, and return 200', async () => {
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${MOCK_API_URL}/mints`);
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      mint1: { symbol: 'SYM1', decimals: 6 },
      mint2: { symbol: 'SYM2', decimals: 9 }, // Defaulted decimals
      mint3: { symbol: 'SYM3', decimals: 9 },
    });
  });

  it('should return 500 if fetch fails (network error)', async () => {
    const error = new Error('Network Error');
    fetch.mockRejectedValue(error);
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Network Error' });
    expect(console.error).toHaveBeenCalledWith('Error fetching token metadata:', error);
  });

  it('should return 500 if fetch response is not ok', async () => {
    fetch.mockResolvedValue({ ok: false });
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Failed to fetch token metadata from DeFiTuna API' });
    expect(console.error).toHaveBeenCalledWith('Error fetching token metadata:', expect.any(Error));
  });

  it('should return 500 if API response data is not an array', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { not: 'an array' } }), // Invalid format
    });
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Invalid token metadata format received from API' });
    expect(console.error).toHaveBeenCalledWith('Error fetching token metadata:', expect.any(Error));
  });
  
  it('should skip tokens without mint or symbol during transformation', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        data: [
          { mint: 'mint1', symbol: 'SYM1', decimals: 6 },
          { symbol: 'SYM_NO_MINT', decimals: 8 }, // No mint
          { mint: 'mint_no_symbol', decimals: 9 }, // No symbol
          { mint: 'mint4', symbol: 'SYM4' },
          { invalid: 'object' }, // Invalid object
        ]
      }),
    });
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      mint1: { symbol: 'SYM1', decimals: 6 },
      mint4: { symbol: 'SYM4', decimals: 9 }, // Defaulted decimals
    });
    // Check that items without mint/symbol were skipped
    expect(responseData).not.toHaveProperty('undefined'); 
    expect(responseData).not.toHaveProperty('mint_no_symbol');
  });
  
}); 