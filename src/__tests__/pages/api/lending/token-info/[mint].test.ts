import { createMocks } from 'node-mocks-http';
import tokenInfoHandler from '@/pages/api/lending/token-info/[mint]';
import { setupFetchMock } from '@/__tests__/setup/lending-api';

describe.skip('/api/lending/token-info/[mint]', () => {
  setupFetchMock();

  it('returns token info successfully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        mint: 'mock-token-mint'
      }
    });

    await tokenInfoHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    
    // Verify token info structure
    expect(data).toHaveProperty('mint');
    expect(data).toHaveProperty('symbol');
    expect(data).toHaveProperty('decimals');
    expect(data).toHaveProperty('logo');
  });

  it('handles invalid method', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: {
        mint: 'mock-token-mint'
      }
    });

    await tokenInfoHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('handles missing mint parameter', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await tokenInfoHandler(req, res);

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

    await tokenInfoHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to fetch token info'
    });
  });
}); 