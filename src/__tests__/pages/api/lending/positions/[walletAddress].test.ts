import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/lending/positions/[walletAddress]';
import { setupFetchMock } from '@/__tests__/setup/lending-api';

jest.mock('@/utils/solanaUtils', () => ({
  getFirstTransactionTimestamp: jest.fn()
}));

const { getFirstTransactionTimestamp } = require('@/utils/solanaUtils');

describe('/api/lending/positions/[walletAddress]', () => {
  setupFetchMock();
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, DEFITUNA_API_URL: 'https://mock-api' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 400 if walletAddress is missing', async () => {
    const { req, res } = createMocks({ method: 'GET', query: {} });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toHaveProperty('message');
  });

  it('returns 400 if walletAddress is not a string', async () => {
    const { req, res } = createMocks({ method: 'GET', query: { walletAddress: [123] } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toHaveProperty('message');
  });

  it('returns 500 if DEFITUNA_API_URL is not set', async () => {
    process.env.DEFITUNA_API_URL = '';
    const { req, res } = createMocks({ method: 'GET', query: { walletAddress: 'abc' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toHaveProperty('message');
  });

  it('returns error if upstream API returns error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found', text: async () => 'not found' });
    const { req, res } = createMocks({ method: 'GET', query: { walletAddress: 'abc' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toHaveProperty('message');
    expect(JSON.parse(res._getData())).toHaveProperty('error');
  });

  it('returns positions with age if all is well', async () => {
    const now = Math.floor(Date.now() / 1000);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ address: 'addr1' }, { address: 'addr2' }])
    });
    getFirstTransactionTimestamp.mockImplementation(async (address) => {
      if (address === 'addr1') return now - 1000;
      if (address === 'addr2') return now - 2000;
      return null;
    });
    const { req, res } = createMocks({ method: 'GET', query: { walletAddress: 'abc' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData()).data;
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('age', 1000);
    expect(data[1]).toHaveProperty('age', 2000);
  });

  it('sets age to null if getFirstTransactionTimestamp returns null', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ address: 'addr1' }])
    });
    getFirstTransactionTimestamp.mockResolvedValue(null);
    const { req, res } = createMocks({ method: 'GET', query: { walletAddress: 'abc' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData()).data;
    expect(data[0]).toHaveProperty('age', null);
  });

  it('returns 500 on network or unexpected error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network fail'));
    const { req, res } = createMocks({ method: 'GET', query: { walletAddress: 'abc' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toHaveProperty('message');
    expect(JSON.parse(res._getData())).toHaveProperty('error');
  });
}); 