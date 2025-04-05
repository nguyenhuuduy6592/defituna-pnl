import { renderHook, act } from '@testing-library/react';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import { openDB } from 'idb';

// Mock the openDB function from idb
jest.mock('idb', () => ({
  openDB: jest.fn()
}));

// Create mock for IndexedDB functionality
const mockCursor = {
  value: null,
  key: null,
  continue: jest.fn(),
  delete: jest.fn().mockResolvedValue(undefined)
};

const mockStore = {
  add: jest.fn().mockResolvedValue(1),
  getAll: jest.fn().mockResolvedValue([]),
  openCursor: jest.fn().mockResolvedValue(mockCursor),
  index: jest.fn().mockReturnValue({
    getAll: jest.fn().mockResolvedValue([]),
    openCursor: jest.fn().mockResolvedValue(mockCursor)
  })
};

const mockTx = {
  done: Promise.resolve(),
  objectStore: jest.fn().mockReturnValue(mockStore),
  complete: Promise.resolve()
};

const mockDB = {
  transaction: jest.fn().mockReturnValue(mockTx),
  close: jest.fn(),
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(true)
  },
  createObjectStore: jest.fn().mockReturnValue({
    createIndex: jest.fn()
  })
};

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

// Mock global IDBKeyRange
global.IDBKeyRange = {
  lowerBound: jest.fn().mockReturnValue({}),
  upperBound: jest.fn().mockReturnValue({})
};

// Setup
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  jest.useFakeTimers();
  
  // Reset mock values and functions
  openDB.mockResolvedValue(mockDB);
  mockCursor.value = null;
  mockCursor.continue.mockClear();
  mockCursor.delete.mockClear();
  
  // Spy on console.error to prevent cluttering test output
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useHistoricalData Hook', () => {
  test('should initialize as disabled by default', () => {
    const { result } = renderHook(() => useHistoricalData());
    
    expect(result.current.enabled).toBe(false);
    expect(result.current.error).toBeNull();
    expect(openDB).not.toHaveBeenCalled();
  });
  
  test('should initialize as enabled if localStorage has it enabled', async () => {
    // Set up localStorage to indicate history is enabled
    localStorageMock.setItem('historicalDataEnabled', 'true');
    
    const { result } = renderHook(() => useHistoricalData());
    
    // Wait for async effects to complete
    await act(async () => {
      await Promise.resolve();
    });
    
    expect(result.current.enabled).toBe(true);
    expect(openDB).toHaveBeenCalled();
  });
  
  test('should handle initialization errors', async () => {
    // Force the openDB function to fail
    openDB.mockRejectedValueOnce(new Error('DB initialization error'));
    localStorageMock.setItem('historicalDataEnabled', 'true');
    
    const { result } = renderHook(() => useHistoricalData());
    
    // Wait for async effects to complete
    await act(async () => {
      await Promise.resolve();
    });
    
    expect(result.current.error).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
  });
  
  test('should toggle history enabled state', async () => {
    const { result } = renderHook(() => useHistoricalData());
    
    // Initially disabled
    expect(result.current.enabled).toBe(false);
    
    // Toggle to enabled
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
    });
    
    expect(result.current.enabled).toBe(true);
    expect(openDB).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('historicalDataEnabled', 'true');
    
    // Toggle to disabled
    await act(async () => {
      await result.current.toggleHistoryEnabled(false);
    });
    
    expect(result.current.enabled).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('historicalDataEnabled', 'false');
  });
  
  test('should save position snapshots when enabled', async () => {
    const { result } = renderHook(() => useHistoricalData());
    
    // Enable history
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
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
    
    // Save positions
    await act(async () => {
      await result.current.savePositionSnapshot(testPositions);
    });
    
    // Check that transaction and store methods were called correctly
    expect(mockDB.transaction).toHaveBeenCalled();
    expect(mockStore.add).toHaveBeenCalledTimes(2);
  });
  
  test('should retrieve position history', async () => {
    // Set up mock data for retrieval
    const mockHistoryData = [
      { id: 'pos1', timestamp: Date.now() - 1000, pnl: 100 },
      { id: 'pos1', timestamp: Date.now() - 2000, pnl: 90 },
      { id: 'pos2', timestamp: Date.now() - 1500, pnl: 50 }
    ];
    
    mockStore.index().getAll.mockResolvedValueOnce(mockHistoryData);
    
    const { result } = renderHook(() => useHistoricalData());
    
    // Enable history
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
    });
    
    // Get history for pos1
    let history;
    await act(async () => {
      history = await result.current.getPositionHistory('pos1');
    });
    
    // Should filter and return only pos1 history
    expect(history.length).toBe(2);
    expect(history.every(item => item.id === 'pos1')).toBe(true);
  });
  
  test('should clean up old data', async () => {
    // Set up a mock cursor that returns one old record
    mockCursor.value = { timestamp: Date.now() - (40 * 24 * 60 * 60 * 1000) }; // 40 days old
    
    // Set up cursor to return null after first iteration
    mockCursor.continue.mockImplementationOnce(() => {
      mockCursor.value = null;
      return Promise.resolve(null);
    });
    
    const { result } = renderHook(() => useHistoricalData());
    
    // Enable history to trigger initial cleanup
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
    });
    
    // Fast-forward timer to trigger scheduled cleanup
    act(() => {
      jest.advanceTimersByTime(24 * 60 * 60 * 1000); // 24 hours
    });
    
    // Wait for any pending promises
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should have deleted the old record
    expect(mockCursor.delete).toHaveBeenCalled();
  });
  
  test('should handle cleanup errors', async () => {
    // Make the cursor throw an error
    mockStore.index().openCursor.mockRejectedValueOnce(new Error('Cursor error'));
    
    const { result } = renderHook(() => useHistoricalData());
    
    // Enable history to trigger cleanup attempt
    await act(async () => {
      await result.current.toggleHistoryEnabled(true);
    });
    
    // Should log the error but not crash
    expect(console.error).toHaveBeenCalled();
    expect(result.current.error).toBeTruthy();
  });
}); 