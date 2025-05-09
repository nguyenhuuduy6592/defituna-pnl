import { createMocks } from 'node-mocks-http';
import priceDataHandler from '@/pages/api/lending/price-data/[mint]';
import { setupFetchMock } from '@/__tests__/setup/lending-api';

describe.skip('/api/lending/price-data/[mint]', () => {
  setupFetchMock();

  it('returns price data successfully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        mint: 'mock-token-mint'
      }
    });

    await priceDataHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    
    // Verify price data structure
    expect(data).toHaveProperty('mint');
    expect(data).toHaveProperty('price');
    expect(data).toHaveProperty('decimals');
    expect(data).toHaveProperty('timestamp');
  });

  it('handles invalid method', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: {
        mint: 'mock-token-mint'
      }
    });

    await priceDataHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('handles missing mint parameter', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await priceDataHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing mint parameter'
    });
  });

  it('handles internal server error', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        mint: 'mock-token-mint'
      }
    });

    // Mock a failure scenario
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Failed to fetch'));

    await priceDataHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to fetch price data'
    });
  });
}); 