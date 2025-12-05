import handler from '../../../pages/api/price/sol';
import { fetchWithTimeout } from '../../../utils/api';

jest.mock('../../../utils/api', () => ({
  fetchWithTimeout: jest.fn(),
}));

describe('/api/price/sol', () => {
  const OLD_ENV = process.env;
  let req, res;
  let handler;
  let fetchWithTimeout;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, DEFITUNA_API_URL: 'https://mockapi' };
    req = { method: 'GET' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Re-import handler and fetchWithTimeout to reset cache and mocks
    handler = require('../../../pages/api/price/sol').default;
    fetchWithTimeout = require('../../../utils/api').fetchWithTimeout;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('returns 405 for non-GET methods', async () => {
    req.method = 'POST';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('returns 500 if DEFITUNA_API_URL is not set', async () => {
    process.env.DEFITUNA_API_URL = '';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'API URL configuration error.' });
  });

  it('returns cached price if within TTL', async () => {
    // First call to set cache
    fetchWithTimeout.mockResolvedValue({
      json: async () => ({ data: { price: '100000', decimals: 3 } }),
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ price: 100, timestamp: 1000000 });
    // Second call should return cache
    res.status.mockClear();
    res.json.mockClear();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].source).toBe('cache');
  });

  it('fetches and returns price from API', async () => {
    fetchWithTimeout.mockResolvedValue({
      json: async () => ({ data: { price: '123456', decimals: 3 } }),
    });
    await handler(req, res);
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      expect.stringContaining('/oracle-prices/So11111111111111111111111111111111111111112'),
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ price: 123.456, timestamp: 1000000 });
  });

  it('returns 500 if API returns invalid data', async () => {
    fetchWithTimeout.mockResolvedValue({ json: async () => ({}) });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch SOL price from CoinGecko' });
  });

  it('returns 500 if fetchWithTimeout throws', async () => {
    fetchWithTimeout.mockRejectedValue(new Error('fail'));
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch SOL price from CoinGecko' });
  });
});