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