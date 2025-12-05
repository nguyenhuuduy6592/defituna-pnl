import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/fetch-pnl';
import { fetchPositions, processPositionsData } from '@/utils/defituna';
import { isValidWalletAddress } from '@/utils/validation';

// Mock the utility functions using aliases
jest.mock('@/utils/defituna');
jest.mock('@/utils/validation');

const USD_MULTIPLIER = 100;

describe('fetch-pnl API Handler', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Default mock implementations
    isValidWalletAddress.mockReturnValue(true);
    fetchPositions.mockResolvedValue([]); // Default to empty positions
    processPositionsData.mockImplementation(async (positions) =>
      positions.map((p) => ({
        ...p, // Simulate processing
        tka_s: p.tokenA?.symbol || '', // Encoded field: tokenA symbol
        tkb_s: p.tokenB?.symbol || '', // Encoded field: tokenB symbol
        pnl: { u: p.pnl_usd || 0 }, // Raw decimal value
      }))
    );
    global.console.error = jest.fn(); // Mock console.error
  });

  it('should return 405 if method is not POST', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' });
  });

  it('should return 400 if wallet address is invalid', async () => {
    isValidWalletAddress.mockReturnValue(false); // Simulate invalid address
    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'invalid-address' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid wallet address format',
      details: 'Please provide a valid Solana wallet address',
    });
    expect(fetchPositions).not.toHaveBeenCalled();
  });

  it('should return 200 with empty positions if fetchPositions returns null/empty', async () => {
    fetchPositions.mockResolvedValueOnce(null);
    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'valid-wallet' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      t_pnl: 0,
      positions: [],
      message: 'No positions found for this wallet',
    });
    expect(processPositionsData).not.toHaveBeenCalled();
  });

  it('should return 200 with processed positions and calculated total PnL for valid request', async () => {
    const mockRawPositions = [
      {
        id: '1',
        pnl_usd: 10.5,
        tokenA: { symbol: 'SOL' },
        tokenB: { symbol: 'USDC' },
      },
      {
        id: '2',
        pnl_usd: -5.25,
        tokenA: { symbol: 'ETH' },
        tokenB: { symbol: 'USDT' },
      },
      {
        id: '3',
        pnl_usd: 0,
        tokenA: { symbol: 'BTC' },
        tokenB: { symbol: 'USDC' },
      }, // Zero PnL
      {
        id: '4',
        pnl_usd: undefined,
        tokenA: { symbol: 'RAY' },
        tokenB: { symbol: 'SOL' },
      }, // Undefined PnL
    ];
    const expectedProcessedPositions = [
      { id: '1', tka_s: 'SOL', tkb_s: 'USDC', pnl_usd: 10.5, pnl: { u: 10.5 } },
      {
        id: '2',
        tka_s: 'ETH',
        tkb_s: 'USDT',
        pnl_usd: -5.25,
        pnl: { u: -5.25 },
      },
      { id: '3', tka_s: 'BTC', tkb_s: 'USDC', pnl_usd: 0, pnl: { u: 0 } },
      {
        id: '4',
        tka_s: 'RAY',
        tkb_s: 'SOL',
        pnl_usd: undefined,
        pnl: { u: 0 },
      },
    ];
    fetchPositions.mockResolvedValue(mockRawPositions);
    processPositionsData.mockResolvedValue(expectedProcessedPositions);

    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'valid-wallet ' }, // Include space to test trim
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());

    // Verify calls
    expect(isValidWalletAddress).toHaveBeenCalledWith('valid-wallet ');
    expect(fetchPositions).toHaveBeenCalledWith('valid-wallet');
    expect(processPositionsData).toHaveBeenCalledWith(mockRawPositions);

    // Verify response structure and processed data
    expect(responseData.positions).toEqual(expectedProcessedPositions);

    // Calculate expected total PnL: 10.50 + (-5.25) + 0 + 0 = 5.25
    const expectedTotalPnl = 5.25;

    expect(responseData.t_pnl).toBeCloseTo(expectedTotalPnl);
  });

  it('should handle errors during fetchPositions', async () => {
    const error = new Error('Fetch failed');
    fetchPositions.mockRejectedValue(error);
    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'valid-wallet' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({ error: 'Fetch failed' })
    );
    expect(console.error).toHaveBeenCalledWith('Error in fetch-pnl:', error);
  });

  it('should handle errors during processPositionsData', async () => {
    const error = new Error('Processing failed');
    fetchPositions.mockResolvedValue([{ id: '1' }]); // Need some data to trigger processing
    processPositionsData.mockRejectedValue(error);
    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'valid-wallet' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({ error: 'Processing failed' })
    );
    expect(console.error).toHaveBeenCalledWith('Error in fetch-pnl:', error);
  });

  it('should handle positions with null or undefined PNL correctly in total calculation', async () => {
    const mockRawPositions = [
      {
        id: '1',
        pnl_usd: 100,
        tokenA: { symbol: 'A' },
        tokenB: { symbol: 'B' },
      },
      {
        id: '2',
        pnl_usd: null,
        tokenA: { symbol: 'C' },
        tokenB: { symbol: 'D' },
      },
      {
        id: '3',
        pnl_usd: undefined,
        tokenA: { symbol: 'E' },
        tokenB: { symbol: 'F' },
      },
      {
        id: '4',
        pnl_usd: -50,
        tokenA: { symbol: 'G' },
        tokenB: { symbol: 'H' },
      },
    ];
    const expectedProcessedPositions = [
      { id: '1', tka_s: 'A', tkb_s: 'B', pnl_usd: 100, pnl: { u: 100 } },
      { id: '2', tka_s: 'C', tkb_s: 'D', pnl_usd: null, pnl: { u: 0 } }, // Null PNL becomes 0
      { id: '3', tka_s: 'E', tkb_s: 'F', pnl_usd: undefined, pnl: { u: 0 } }, // Undefined PNL becomes 0
      { id: '4', tka_s: 'G', tkb_s: 'H', pnl_usd: -50, pnl: { u: -50 } },
    ];
    fetchPositions.mockResolvedValue(mockRawPositions);
    processPositionsData.mockResolvedValue(expectedProcessedPositions);

    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'valid-wallet' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());

    // Expected total PnL: 100 + 0 + 0 + (-50) = 50
    const expectedTotalPnl = 50;

    expect(responseData.t_pnl).toBeCloseTo(expectedTotalPnl);
    expect(responseData.positions).toEqual(expectedProcessedPositions);
  });
});
