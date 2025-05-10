import { createMocks } from 'node-mocks-http';
import vaultsHandler from '@/pages/api/lending/vaults';
import { setupFetchMock } from '@/__tests__/setup/lending-api';

describe.skip('/api/lending/vaults', () => {
  setupFetchMock();

  it('returns vault data successfully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await vaultsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(Array.isArray(data)).toBe(true);
    
    // Verify vault data structure
    data.forEach((vault: any) => {
      expect(vault).toHaveProperty('address');
      expect(vault).toHaveProperty('mint');
      expect(vault).toHaveProperty('depositedFunds');
      expect(vault.depositedFunds).toHaveProperty('amount');
      expect(vault.depositedFunds).toHaveProperty('usdValue');
      expect(vault).toHaveProperty('borrowedFunds');
      expect(vault.borrowedFunds).toHaveProperty('amount');
      expect(vault.borrowedFunds).toHaveProperty('usdValue');
      expect(vault).toHaveProperty('supplyLimit');
      expect(vault.supplyLimit).toHaveProperty('amount');
      expect(vault.supplyLimit).toHaveProperty('usdValue');
      expect(vault).toHaveProperty('utilization');
      expect(vault).toHaveProperty('supplyApy');
      expect(vault).toHaveProperty('borrowApy');
      expect(vault).toHaveProperty('borrowedShares');
      expect(vault).toHaveProperty('depositedShares');
      expect(vault).toHaveProperty('pythOracleFeedId');
      expect(vault).toHaveProperty('pythOraclePriceUpdate');
    });
  });

  it('handles invalid method', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await vaultsHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('handles internal server error', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    // Mock a failure scenario
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Failed to fetch'));

    await vaultsHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to fetch vault data'
    });
  });
});

describe('/api/lending/vaults/[vaultAddress]', () => {
  const vaultAddressHandler = require('@/pages/api/lending/vaults/[vaultAddress]').default;
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, DEFITUNA_API_URL: 'https://mock-api' };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  it('returns vault details successfully', async () => {
    const mockVault = { address: '0x123', data: 'mock' };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockVault
    });
    const { createMocks } = require('node-mocks-http');
    const { req, res } = createMocks({
      method: 'GET',
      query: { vaultAddress: '0x123' }
    });
    await vaultAddressHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockVault);
  });

  it('returns 400 if vaultAddress is missing', async () => {
    const { createMocks } = require('node-mocks-http');
    const { req, res } = createMocks({
      method: 'GET',
      query: {}
    });
    await vaultAddressHandler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Vault address is required and must be a string.' });
  });

  it('returns 400 if vaultAddress is not a string', async () => {
    const { createMocks } = require('node-mocks-http');
    const { req, res } = createMocks({
      method: 'GET',
      query: { vaultAddress: [123] }
    });
    await vaultAddressHandler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Vault address is required and must be a string.' });
  });

  it('returns 500 if DEFITUNA_API_URL is not set', async () => {
    process.env.DEFITUNA_API_URL = '';
    const { createMocks } = require('node-mocks-http');
    const { req, res } = createMocks({
      method: 'GET',
      query: { vaultAddress: '0x123' }
    });
    await vaultAddressHandler(req, res);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ message: 'API URL configuration error.' });
  });

  it('returns error if upstream API returns error', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not found error'
    });
    const { createMocks } = require('node-mocks-http');
    const { req, res } = createMocks({
      method: 'GET',
      query: { vaultAddress: '0x123' }
    });
    await vaultAddressHandler(req, res);
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Failed to fetch vault details: Not Found', error: 'Not found error' });
  });

  it('returns 500 on network or fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network fail'));
    const { createMocks } = require('node-mocks-http');
    const { req, res } = createMocks({
      method: 'GET',
      query: { vaultAddress: '0x123' }
    });
    await vaultAddressHandler(req, res);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Error fetching vault details from upstream API.', error: 'Network fail' });
  });
}); 