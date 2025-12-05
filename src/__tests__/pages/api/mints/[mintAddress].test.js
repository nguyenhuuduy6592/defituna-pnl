import handler from '@/pages/api/mints/[mintAddress]';
import { createMocks } from 'node-mocks-http';

const OLD_ENV = process.env;

describe('API Route: /api/mints/[mintAddress]', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, DEFITUNA_API_URL: 'https://mock-api.com' };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  it('returns 400 if mintAddress is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toMatchObject({ message: expect.any(String) });
  });

  it('returns 500 if DEFITUNA_API_URL is not set', async () => {
    process.env.DEFITUNA_API_URL = '';
    const { req, res } = createMocks({
      method: 'GET',
      query: { mintAddress: 'abc' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toMatchObject({ message: expect.any(String) });
  });

  it('returns 200 and data on success', async () => {
    const mockData = { foo: 'bar' };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    const { req, res } = createMocks({
      method: 'GET',
      query: { mintAddress: 'abc' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockData);
  });

  it('returns upstream error if fetch fails with non-ok', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not found',
    });
    const { req, res } = createMocks({
      method: 'GET',
      query: { mintAddress: 'abc' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toMatchObject({ message: expect.any(String), error: 'Not found' });
  });

  it('returns 500 on network or other error', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));
    const { req, res } = createMocks({
      method: 'GET',
      query: { mintAddress: 'abc' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toMatchObject({ message: expect.any(String), error: 'Network error' });
  });
});