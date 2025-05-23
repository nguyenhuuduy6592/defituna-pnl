import handler from '@/pages/api/tokens';

// Mock the global fetch
global.fetch = jest.fn();

// Mock console.error
global.console = {
  ...global.console,
  error: jest.fn(),
};

describe('tokens API Handler (/api/tokens)', () => {
  const OLD_ENV = process.env;
  let req, res;
  let fetchMock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    req = { method: 'GET' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
    delete global.fetch;
  });

  it('should fetch token metadata, transform it, and return 200', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [
        { mint: 'mint1', symbol: 'AAA', decimals: 6 },
        { mint: 'mint2', symbol: 'BBB' } // no decimals, should default to 9
      ] })
    });
    await handler(req, res);
    expect(fetchMock).toHaveBeenCalledWith(`${process.env.DEFITUNA_API_URL}/mints`);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      mint1: { symbol: 'AAA', decimals: 6 },
      mint2: { symbol: 'BBB', decimals: 9 }
    });
  });

  it('should return 500 if fetch fails (network error)', async () => {
    fetchMock.mockRejectedValue(new Error('fail'));
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });

  it('should return 500 if fetch response is not ok', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch token metadata from DeFiTuna API' });
  });

  it('should return 500 if API response data is not an array', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: null })
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token metadata format received from API' });
  });
  
  it('should skip tokens without mint or symbol during transformation', async () => {
    fetchMock.mockResolvedValue({
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
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      mint1: { symbol: 'SYM1', decimals: 6 },
      mint4: { symbol: 'SYM4', decimals: 9 }, // Defaulted decimals
    });
  });
  
}); 