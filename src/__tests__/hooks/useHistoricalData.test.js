import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { 
  initializeDB, 
  savePositionSnapshot as mockSaveSnapshot, // Alias imported mock
  getPositionHistory as mockGetHistory,   // Alias imported mock
  deletePositionHistory as mockDeleteHistory, // Alias imported mock
  clearAllHistory as mockClearHistory,     // Alias imported mock
  getData, 
  saveData, 
  STORE_NAMES
} from '@/utils/indexedDB'; // Import mocked functions

// Mock position data
const mockPosition = { 
  id: 'pos1', 
  symbol: 'ETH/USD', 
  currentPrice: 2000, 
  liquidationPrice: 1500 
};
const mockPositions = [mockPosition];

// Helper to reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Reset mocks to default implementations
  initializeDB.mockResolvedValue({});
  mockSaveSnapshot.mockResolvedValue(true);
  mockGetHistory.mockResolvedValue([]);
  mockDeleteHistory.mockResolvedValue(true);
  mockClearHistory.mockResolvedValue(true);
  getData.mockImplementation((db, store, key) => {
    if (key === 'historicalDataEnabled') return Promise.resolve(null); // Default disabled
    return Promise.resolve(null);
  });
  saveData.mockResolvedValue(true);
});

describe('useHistoricalData Hook', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  
  test('should initialize as disabled by default and initialize DB', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useHistoricalData());
    // Wait for initial useEffect to run
    await act(async () => { if (waitForNextUpdate) await waitForNextUpdate(); });

    expect(result.current.enabled).toBe(false);
    expect(result.current.error).toBeNull();
    // initializeDB *is* called in the initial useEffect, regardless of enabled state
    expect(initializeDB).toHaveBeenCalled();
  });
  
  test('should initialize as enabled if IndexedDB has it enabled', async () => {
    // Mock getData to return enabled state
    getData.mockResolvedValue({ value: true });

    const { result, waitForNextUpdate } = renderHook(() => useHistoricalData());
    await act(async () => { if (waitForNextUpdate) await waitForNextUpdate(); });
    
    expect(result.current.enabled).toBe(true);
    expect(initializeDB).toHaveBeenCalled();
  });
  
  test('should handle initialization errors', async () => {
    const initError = new Error('DB Init Failed');
    initializeDB.mockRejectedValue(initError);
    getData.mockResolvedValue(null);

    const { result, waitForNextUpdate } = renderHook(() => useHistoricalData());
    await act(async () => { if (waitForNextUpdate) await waitForNextUpdate(); });

    expect(result.current.enabled).toBe(false);
    expect(result.current.error).toBe('Failed to initialize position history database');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize position history database', initError);
  });

  test('should toggle history enabled state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useHistoricalData());
    await act(async () => { if (waitForNextUpdate) await waitForNextUpdate(); }); // Initial load (disabled)

    expect(result.current.enabled).toBe(false);
    const initialDbInitCalls = initializeDB.mock.calls.length; // DB initialized once on load

    // Enable
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
    });
    expect(result.current.enabled).toBe(true);
    // initializeDB should NOT be called again if already initialized successfully
    expect(initializeDB).toHaveBeenCalledTimes(initialDbInitCalls);
    // Correct assertion for saveData arguments
    expect(saveData).toHaveBeenCalledWith(expect.anything(), STORE_NAMES.SETTINGS, {
      key: 'historicalDataEnabled',
      value: true
    });
    
    // Disable
    await act(async () => {
      await result.current.toggleHistoryEnabled(false);
    });
    expect(result.current.enabled).toBe(false);
    expect(initializeDB).toHaveBeenCalledTimes(initialDbInitCalls);
    expect(saveData).toHaveBeenCalledWith(expect.anything(), STORE_NAMES.SETTINGS, {
      key: 'historicalDataEnabled',
      value: false
    });
  });

  test('should call savePositionSnapshot when enabled', async () => {
    // Start enabled
    getData.mockResolvedValue({ value: true });
    const { result, waitForNextUpdate } = renderHook(() => useHistoricalData());
    // Wait for DB initialization and setting enabled to true
    await act(async () => { if (waitForNextUpdate) await waitForNextUpdate(); }); 
    expect(result.current.enabled).toBe(true);

    // Call the returned function
    await act(async () => {
      await result.current.savePositionSnapshot(mockPositions);
    });

    expect(mockSaveSnapshot).toHaveBeenCalledTimes(1);
    // The hook passes dbInstance, positions array, and a timestamp
    expect(mockSaveSnapshot).toHaveBeenCalledWith(expect.anything(), mockPositions, expect.any(Number)); 
  });

  test('should NOT call savePositionSnapshot when disabled', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useHistoricalData());
    await act(async () => { if (waitForNextUpdate) await waitForNextUpdate(); });
    expect(result.current.enabled).toBe(false);

    // Call the returned function
    await act(async () => {
      await result.current.savePositionSnapshot(mockPositions);
    });

    expect(mockSaveSnapshot).not.toHaveBeenCalled();
  });

  test('should call getPositionHistory', async () => {
    const mockHistory = [{ timestamp: 1, price: 100 }, { timestamp: 2, price: 110 }];
    mockGetHistory.mockResolvedValue(mockHistory);
    // Start enabled
    getData.mockResolvedValue({ value: true });

    const { result, waitForNextUpdate } = renderHook(() => useHistoricalData());
    await act(async () => { if (waitForNextUpdate) await waitForNextUpdate(); });

    let historyData = [];
    // Call the returned function
    await act(async () => {
      historyData = await result.current.getPositionHistory('pos1');
    });

    expect(mockGetHistory).toHaveBeenCalledTimes(1);
    // Hook passes dbInstance, positionId, and potentially timeRange (undefined in this case)
    expect(mockGetHistory).toHaveBeenCalledWith(expect.anything(), 'pos1', undefined);
    expect(historyData).toEqual(mockHistory);
  });

  test('should handle errors during snapshot saving via hook fn', async () => {
    const saveError = new Error('Save Failed');
    mockSaveSnapshot.mockRejectedValue(saveError);
    getData.mockResolvedValue({ value: true });

    const { result, waitForNextUpdate } = renderHook(() => useHistoricalData());
    await act(async () => { if (waitForNextUpdate) await waitForNextUpdate(); });

    await act(async () => {
      // Call the returned function
      await result.current.savePositionSnapshot(mockPositions);
    });

    expect(result.current.error).toBe('Failed to save position history data');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save position history data', saveError);
  });

  test('should handle errors during history retrieval via hook fn', async () => {
    const getError = new Error('Get Failed');
    mockGetHistory.mockRejectedValue(getError);
    getData.mockResolvedValue({ value: true });

    const { result, waitForNextUpdate } = renderHook(() => useHistoricalData());
    await act(async () => { if (waitForNextUpdate) await waitForNextUpdate(); });

    await act(async () => {
      // Call the returned function
      await result.current.getPositionHistory('pos1');
    });

    expect(result.current.error).toBe('Failed to retrieve position history data');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to retrieve position history data', getError);
  });

  // Tests for deleteHistory and clearHistory cannot be added 
  // as the hook doesn't expose these functions directly.
}); 