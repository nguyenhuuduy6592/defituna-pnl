import { renderHook, act } from '@testing-library/react';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import * as indexedDB from '../../utils/indexedDB';

// Mock the indexedDB utility functions
jest.mock('../../utils/indexedDB', () => ({
  initializeDB: jest.fn(),
  savePositionSnapshot: jest.fn(),
  getPositionHistory: jest.fn(),
  cleanupOldData: jest.fn(),
  DEFAULT_RETENTION_DAYS: 30
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Replace localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Setup
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  jest.useFakeTimers();
  
  // Reset mock values and functions with successful responses
  const mockDB = {};
  indexedDB.initializeDB.mockResolvedValue(mockDB);
  indexedDB.savePositionSnapshot.mockResolvedValue(true);
  indexedDB.getPositionHistory.mockResolvedValue([]);
  indexedDB.cleanupOldData.mockResolvedValue(true);
  
  // Spy on console.error to prevent cluttering test output
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useHistoricalData Hook', () => {
  test('should initialize as disabled by default', () => {
    const { result } = renderHook(() => useHistoricalData());
    
    expect(result.current.enabled).toBe(false);
    expect(result.current.error).toBeNull();
    expect(indexedDB.initializeDB).not.toHaveBeenCalled();
  });
  
  test('should initialize as enabled if localStorage has it enabled', async () => {
    localStorageMock.setItem('historicalDataEnabled', 'true');
    
    const { result } = renderHook(() => useHistoricalData());
    
    // Wait for all promises to resolve
    await act(async () => {
      await Promise.resolve();
      jest.runAllTimers();
    });
    
    expect(result.current.enabled).toBe(true);
    expect(indexedDB.initializeDB).toHaveBeenCalled();
  });
  
  test('should handle initialization errors', async () => {
    indexedDB.initializeDB.mockRejectedValueOnce(new Error('DB initialization error'));
    localStorageMock.setItem('historicalDataEnabled', 'true');
    
    const { result } = renderHook(() => useHistoricalData());
    
    await act(async () => {
      await Promise.resolve();
      jest.runAllTimers();
    });
    
    expect(result.current.error).toBe('Failed to initialize position history database');
    expect(console.error).toHaveBeenCalled();
  });
  
  test('should toggle history enabled state', async () => {
    const { result } = renderHook(() => useHistoricalData());
    
    expect(result.current.enabled).toBe(false);
    
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
      await Promise.resolve();
      jest.runAllTimers();
    });
    
    expect(result.current.enabled).toBe(true);
    expect(indexedDB.initializeDB).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('historicalDataEnabled', 'true');
    
    await act(async () => {
      await result.current.toggleHistoryEnabled(false);
      await Promise.resolve();
    });
    
    expect(result.current.enabled).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('historicalDataEnabled', 'false');
  });
  
  test('should save position snapshots when enabled', async () => {
    const { result } = renderHook(() => useHistoricalData());
    
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
      await Promise.resolve();
    });
    
    const testPositions = [
      { 
        id: 'pos1', 
        positionAddress: '0xabc123',
        pair: 'ETH-USDC',
        pnl: 100
      },
      { 
        id: 'pos2', 
        positionAddress: '0xdef456',
        pair: 'BTC-USDC',
        pnl: 200
      }
    ];
    
    await act(async () => {
      await result.current.savePositionSnapshot(testPositions);
      await Promise.resolve();
    });
    
    expect(indexedDB.savePositionSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      testPositions,
      expect.any(Number)
    );
  });
  
  test('should retrieve position history', async () => {
    const mockHistoryData = [
      { id: 'pos1', timestamp: Date.now() - 1000, pnl: 100 },
      { id: 'pos1', timestamp: Date.now() - 2000, pnl: 90 }
    ];
    
    indexedDB.getPositionHistory.mockResolvedValueOnce(mockHistoryData);
    
    const { result } = renderHook(() => useHistoricalData());
    
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
      await Promise.resolve();
    });
    
    let history;
    await act(async () => {
      history = await result.current.getPositionHistory('pos1');
      await Promise.resolve();
    });
    
    expect(history).toEqual(mockHistoryData);
    expect(indexedDB.getPositionHistory).toHaveBeenCalledWith(
      expect.anything(),
      'pos1',
      undefined
    );
  });
  
  test('should clean up old data', async () => {
    const { result } = renderHook(() => useHistoricalData());
    
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
      await Promise.resolve();
      jest.runAllTimers();
    });
    
    expect(indexedDB.cleanupOldData).toHaveBeenCalledWith(
      expect.anything(),
      indexedDB.DEFAULT_RETENTION_DAYS
    );
  });
  
  test('should handle cleanup errors', async () => {
    indexedDB.cleanupOldData.mockRejectedValueOnce(new Error('Cleanup error'));
    
    const { result } = renderHook(() => useHistoricalData());
    
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
      await Promise.resolve();
      jest.runAllTimers();
    });
    
    expect(console.error).toHaveBeenCalled();
    expect(result.current.error).toBe('Failed to clean up old position history data');
  });
}); 