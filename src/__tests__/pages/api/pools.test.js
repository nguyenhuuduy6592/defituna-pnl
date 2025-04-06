import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/pools';
import { fetchAllPools } from '@/utils/defituna';

// Mock the fetchAllPools utility using alias
jest.mock('@/utils/defituna');

// Mock console.error
global.console = {
  ...global.console, // Keep original console methods
  error: jest.fn(),
};

// Helper function to create mock pool data
const createMockPool = (id, tvl = 100000, volume24h = 50000, fees24h = 25) => ({
  address: id,
  tvl_usdc: tvl,
  tokenA: { symbol: 'TKA' + id },
  tokenB: { symbol: 'TKB' + id },
  stats: {
    '24h': { volume: volume24h, fees: fees24h, yield_over_tvl: fees24h / tvl },
    '7d': { volume: volume24h * 7, fees: fees24h * 7, yield_over_tvl: (fees24h * 7) / tvl },
    '30d': { volume: volume24h * 30, fees: fees24h * 30, yield_over_tvl: (fees24h * 30) / tvl },
  },
  price_change_pct: { '24h': 2, '7d': 5, '30d': 10 },
  provider: 'provider' + id
});


describe('pools API Handler (/api/pools)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock successful response
    fetchAllPools.mockResolvedValue([createMockPool('pool1'), createMockPool('pool2')]);
  });

  it('should return 405 if method is not GET', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' });
  });

  it('should fetch all pools, process them, and return 200 if no address is provided', async () => {
    const mockPools = [createMockPool('pool1'), createMockPool('pool2')];
    fetchAllPools.mockResolvedValue(mockPools);
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(fetchAllPools).toHaveBeenCalledTimes(1);
    expect(responseData.data).toBeInstanceOf(Array);
    expect(responseData.data).toHaveLength(2);
    // Check if derived metrics structure exists for the first pool
    expect(responseData.data[0].metrics).toBeDefined();
    expect(responseData.data[0].metrics['24h']).toBeDefined();
    expect(responseData.data[0].metrics['24h']).toHaveProperty('feeAPR');
    expect(responseData.data[0].metrics['24h']).toHaveProperty('volumeTVLRatio');
    expect(responseData.data[0].metrics['24h']).toHaveProperty('volatility');
  });

  it('should filter and return a specific pool if address is provided via poolAddress query param', async () => {
    const mockPools = [createMockPool('pool1'), createMockPool('pool2')];
    fetchAllPools.mockResolvedValue(mockPools);
    const { req, res } = createMocks({ 
      method: 'GET', 
      query: { poolAddress: 'pool1' } 
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(fetchAllPools).toHaveBeenCalledTimes(1);
    expect(responseData.data).toBeInstanceOf(Array);
    expect(responseData.data).toHaveLength(1);
    expect(responseData.data[0].address).toBe('pool1');
    expect(responseData.data[0].metrics).toBeDefined(); // Check metrics are still present
  });
  
   it('should filter and return a specific pool if address is provided via address query param', async () => {
    const mockPools = [createMockPool('pool1'), createMockPool('pool2')];
    fetchAllPools.mockResolvedValue(mockPools);
    const { req, res } = createMocks({ 
      method: 'GET', 
      query: { address: 'pool2' } // Use 'address' param this time
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(fetchAllPools).toHaveBeenCalledTimes(1);
    expect(responseData.data).toBeInstanceOf(Array);
    expect(responseData.data).toHaveLength(1);
    expect(responseData.data[0].address).toBe('pool2');
    expect(responseData.data[0].metrics).toBeDefined();
  });

  it('should return 404 if the requested pool address is not found', async () => {
    const mockPools = [createMockPool('pool1'), createMockPool('pool2')];
    fetchAllPools.mockResolvedValue(mockPools);
    const { req, res } = createMocks({ 
      method: 'GET', 
      query: { address: 'nonexistentpool' } 
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Pool not found: nonexistentpool' });
    expect(console.error).toHaveBeenCalledWith('[pools API] Pool nonexistentpool not found in the fetched pools');
  });

  it('should return 500 if fetchAllPools fails', async () => {
    const error = new Error('Failed to fetch');
    fetchAllPools.mockRejectedValue(error);
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Failed to fetch' }));
    expect(console.error).toHaveBeenCalledWith('Error in pools API:', error);
  });
  
  it('should return 500 if fetchAllPools returns invalid data structure (not an array)', async () => {
    fetchAllPools.mockResolvedValue({ not: 'an array' }); // Simulate invalid structure
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Invalid pools data structure from API' });
    expect(console.error).toHaveBeenCalledWith('[pools API] Invalid pools data structure:', { not: 'an array' });
  });
  
  it('should return 500 if fetchAllPools returns null', async () => {
    fetchAllPools.mockResolvedValue(null); // Simulate null response
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Invalid pools data structure from API' });
    expect(console.error).toHaveBeenCalledWith('[pools API] Invalid pools data structure:', null);
  });
  
   it('should correctly calculate derived metrics', async () => {
    // Pool with known values for easier metric calculation checks
    // TVL = 1,000,000; Fees (24h) = 1000; Volume (24h) = 200,000; Price Change (24h) = 3%
    const testPool = createMockPool('metricpool', 1000000, 200000, 1000);
    testPool.price_change_pct['24h'] = 3;
    
    fetchAllPools.mockResolvedValue([testPool]);
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.data).toHaveLength(1);
    const processedPool = responseData.data[0];

    // Expected Fee APR (24h) = (1000 / 1000000) * (365 / 1) * 100 = 36.5%
    expect(processedPool.metrics['24h'].feeAPR).toBeCloseTo(36.5);
    
    // Expected Volume/TVL Ratio (24h) = 200000 / 1000000 = 0.2
    expect(processedPool.metrics['24h'].volumeTVLRatio).toBeCloseTo(0.2);
    
    // Expected Volatility (24h, 3% change) = low
    expect(processedPool.metrics['24h'].volatility).toBe('low');
  });
  
  it('should handle string numbers in pool stats gracefully', async () => {
     const stringPool = {
      address: 'stringpool',
      tvl_usdc: '1000000', // String TVL
      tokenA: { symbol: 'STR' },
      tokenB: { symbol: 'NUM' },
      stats: {
        '24h': { volume: '200000', fees: '1000' }, // String stats
        '7d': {}, 
        '30d': {}
      },
      price_change_pct: { '24h': '3' } // String price change
    };
    fetchAllPools.mockResolvedValue([stringPool]);
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    const processedPool = responseData.data[0];
    
    // Check if metrics were calculated despite string inputs
    expect(processedPool.metrics['24h'].feeAPR).toBeCloseTo(36.5);
    expect(processedPool.metrics['24h'].volumeTVLRatio).toBeCloseTo(0.2);
    expect(processedPool.metrics['24h'].volatility).toBe('low');
  });

}); 