import { fetchWalletPnL } from '@/utils/pnlUtils';
import { 
  addWalletAddressToPositions, 
  decodePositions, 
  decodeValue 
} from '@/utils/positionUtils';

// Mock the dependencies from positionUtils
jest.mock('@/utils/positionUtils', () => ({
  addWalletAddressToPositions: jest.fn((positions, walletAddress) => 
    positions.map(p => ({ ...p, walletAddress }))
  ),
  decodePositions: jest.fn(positions => positions), // Simple pass-through mock
  decodeValue: jest.fn((value, multiplier) => value / multiplier), // Simple decoding mock
}));

// Mock global fetch
global.fetch = jest.fn();

describe('fetchWalletPnL utility', () => {
  const mockWalletAddress = 'testWallet123';

  beforeEach(() => {
    // Clear mocks before each test
    fetch.mockClear();
    addWalletAddressToPositions.mockClear();
    decodePositions.mockClear();
    decodeValue.mockClear();
  });

  it('should return null if no wallet address is provided', async () => {
    const result = await fetchWalletPnL(null);
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should fetch, process, and return data on successful API call', async () => {
    const mockRawData = {
        t_pnl: 123450, // Encoded total PnL (1234.50)
        positions: [
            { id: 'pos1', /* other encoded fields */ },
            { id: 'pos2', /* other encoded fields */ },
        ],
    };
    const expectedProcessedData = {
        totalPnL: 1234.50,
        positions: [
            { id: 'pos1', walletAddress: mockWalletAddress },
            { id: 'pos2', walletAddress: mockWalletAddress },
        ],
    };

    // Create a shallow copy of mockRawData
    const mockDataCopy = { ...mockRawData };

    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataCopy, // Use the copy here
    });

    const result = await fetchWalletPnL(mockWalletAddress);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/fetch-pnl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: mockWalletAddress }),
    });
    expect(decodeValue).toHaveBeenCalledTimes(1);
    expect(decodeValue.mock.calls[0][0]).toBe(mockRawData.t_pnl);
    expect(decodeValue.mock.calls[0][1]).toBe(100);
    expect(decodePositions).toHaveBeenCalledTimes(1);
    expect(decodePositions).toHaveBeenCalledWith(mockRawData.positions);
    expect(addWalletAddressToPositions).toHaveBeenCalledTimes(1);
    expect(addWalletAddressToPositions).toHaveBeenCalledWith(mockRawData.positions, mockWalletAddress);
    expect(result).toEqual(expectedProcessedData);
});

  it('should handle API error (non-ok response) and return error object', async () => {
    const mockError = { error: 'Failed to fetch from chain' };
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    const result = await fetchWalletPnL(mockWalletAddress);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ error: mockError.error });
    expect(decodeValue).not.toHaveBeenCalled();
    expect(decodePositions).not.toHaveBeenCalled();
    expect(addWalletAddressToPositions).not.toHaveBeenCalled();
  });

  it('should handle network error (fetch rejection) and return error object', async () => {
    const mockNetworkError = new Error('Network Failure');
    fetch.mockRejectedValueOnce(mockNetworkError);

    const result = await fetchWalletPnL(mockWalletAddress);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ error: mockNetworkError.message });
    expect(decodeValue).not.toHaveBeenCalled();
    expect(decodePositions).not.toHaveBeenCalled();
    expect(addWalletAddressToPositions).not.toHaveBeenCalled();
  });

  it('should correctly handle data without t_pnl field', async () => {
    const mockRawData = { 
        // No t_pnl field
        positions: [{ id: 'pos1' }] 
    };
     const expectedProcessedData = {
      positions: [{ id: 'pos1', walletAddress: mockWalletAddress }],
    };

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockRawData });
    const result = await fetchWalletPnL(mockWalletAddress);

    expect(decodeValue).not.toHaveBeenCalled();
    expect(decodePositions).toHaveBeenCalledTimes(1);
    expect(addWalletAddressToPositions).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedProcessedData);
  });

   it('should correctly handle data without positions field', async () => {
    const mockRawData = { t_pnl: 5000 }; // No positions
    const expectedProcessedData = { totalPnL: 50.00 };

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockRawData });
    const result = await fetchWalletPnL(mockWalletAddress);

    expect(decodeValue).toHaveBeenCalledTimes(1);
    expect(decodePositions).not.toHaveBeenCalled();
    expect(addWalletAddressToPositions).not.toHaveBeenCalled();
    expect(result).toEqual(expectedProcessedData);
  });
}); 