import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';

// --- Mocks ---
jest.mock('@/utils/indexedDB', () => ({
  initializeDB: jest.fn(),
  getData: jest.fn(),
  saveData: jest.fn(),
  STORE_NAMES: {
    SETTINGS: 'settings'
  },
}));

// --- Constants & Helpers ---
const DEFAULT_INTERVAL = 30;
const AUTO_REFRESH_KEY = 'autoRefresh';
const REFRESH_INTERVAL_KEY = 'refreshInterval';
const MOCK_DB = { mockDbInstance: true };

// Helper to mock document visibility
let visibilityState = 'visible';
const listeners = {};
const mockVisibility = (state) => {
  visibilityState = state;
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: function () { return visibilityState; }
  });
  // Trigger visibilitychange event listeners
  if (listeners['visibilitychange']) {
    listeners['visibilitychange'].forEach(cb => cb());
  }
};

// Mock add/removeEventListener for visibilitychange
const originalAddEventListener = document.addEventListener;
const originalRemoveEventListener = document.removeEventListener;

// --- Test Suite Setup ---
describe('useAutoRefresh Hook', () => {
  let mockOnRefresh;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeAll(() => {
    // Mock document visibility globally for all tests in this suite
    document.addEventListener = jest.fn((event, cb) => {
        if (event === 'visibilitychange') {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(cb);
        }
    });
    document.removeEventListener = jest.fn((event, cb) => {
         if (event === 'visibilitychange' && listeners[event]) {
            listeners[event] = listeners[event].filter(listener => listener !== cb);
        }
    });
  });

  beforeEach(() => {
    // Use fake timers
    jest.useFakeTimers();

    // Reset mocks
    jest.clearAllMocks();
    mockOnRefresh = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Default successful mock implementations
    initializeDB.mockResolvedValue(MOCK_DB);
    getData.mockResolvedValue(null); // Default: cache miss for both keys
    saveData.mockResolvedValue(true);

    // Reset visibility to default
    mockVisibility('visible');
    // Clear any leftover listeners
    if (listeners['visibilitychange']) listeners['visibilitychange'] = []; 
    document.addEventListener.mockClear();
    document.removeEventListener.mockClear();
  });

  afterEach(() => {
    // Restore real timers
    jest.useRealTimers();
    // Restore console spies
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
  
  afterAll(() => {
    // Restore original document listeners
    document.addEventListener = originalAddEventListener;
    document.removeEventListener = originalRemoveEventListener;
  });

  // Helper function to render the hook
  const renderAutoRefreshHook = (interval = DEFAULT_INTERVAL) => renderHook(() => useAutoRefresh(mockOnRefresh, interval));

  // --- Test Cases ---

  describe('Initialization', () => {
    it('should initialize with default values and load from empty DB', async () => {
      const { result } = renderAutoRefreshHook();

      expect(result.current.autoRefresh).toBe(false);
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      expect(result.current.refreshCountdown).toBe(DEFAULT_INTERVAL);
      expect(result.current.error).toBeNull();

      await act(async () => {
          await jest.runAllTimersAsync();
      });
      
      // Expect initializeDB to be called twice (load and save effects)
      expect(initializeDB).toHaveBeenCalledTimes(2);
      expect(getData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, AUTO_REFRESH_KEY);
      expect(getData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, REFRESH_INTERVAL_KEY);
      
      expect(result.current.autoRefresh).toBe(false);
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      expect(result.current.refreshCountdown).toBe(DEFAULT_INTERVAL); 
      expect(result.current.error).toBeNull();
      
      await waitFor(() => {
          expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, { key: AUTO_REFRESH_KEY, value: false });
          expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, { key: REFRESH_INTERVAL_KEY, value: DEFAULT_INTERVAL });
      });
    });
    
    it('should initialize with provided initialInterval', async () => {
        const customInterval = 60;
        const { result } = renderAutoRefreshHook(customInterval);
        
        expect(result.current.refreshInterval).toBe(customInterval);
        expect(result.current.refreshCountdown).toBe(customInterval);
        
        // Wait for async load/save effects
        await act(async () => { await jest.runAllTimersAsync(); });
        await waitFor(() => { 
            expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, { key: REFRESH_INTERVAL_KEY, value: customInterval });
        });
    });

    it('should load valid settings from IndexedDB', async () => {
        const savedInterval = 15;
        getData
            .mockResolvedValueOnce({ key: AUTO_REFRESH_KEY, value: true }) // Mock autoRefresh = true
            .mockResolvedValueOnce({ key: REFRESH_INTERVAL_KEY, value: savedInterval }); // Mock interval = 15

        const { result } = renderAutoRefreshHook(); // Use default initial interval

        await act(async () => { await jest.runAllTimersAsync(); }); 

        expect(getData).toHaveBeenCalledTimes(2);
        expect(result.current.autoRefresh).toBe(true);
        expect(result.current.refreshInterval).toBe(savedInterval);
        expect(result.current.refreshCountdown).toBe(savedInterval); // Should initialize countdown to loaded interval
        expect(result.current.error).toBeNull();
    });

    it('should handle invalid interval in IndexedDB (use default)', async () => {
        getData
            .mockResolvedValueOnce({ key: AUTO_REFRESH_KEY, value: true })
            .mockResolvedValueOnce({ key: REFRESH_INTERVAL_KEY, value: 'abc' }); // Invalid interval

        const { result } = renderAutoRefreshHook();
        
        await act(async () => { await jest.runAllTimersAsync(); }); 

        expect(result.current.autoRefresh).toBe(true); // Still loads autoRefresh correctly
        expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL); // Falls back to default
        expect(result.current.refreshCountdown).toBe(DEFAULT_INTERVAL); // Uses default
        expect(result.current.error).toBeNull(); 
    });

    it('should handle IndexedDB load errors gracefully', async () => {
        const dbError = new Error('DB Load Failed');
        // Mock initializeDB to fail on first call (load), succeed on second (save attempt)
        initializeDB
          .mockRejectedValueOnce(dbError) 
          .mockResolvedValue(MOCK_DB); 

        const { result } = renderAutoRefreshHook();

        // Wait for effects to run
        await act(async () => { await jest.runAllTimersAsync(); });
        
        // Assert calls
        expect(initializeDB).toHaveBeenCalledTimes(2); // Called by load and save effects
        expect(getData).not.toHaveBeenCalled(); // getData skipped due to load init failure
        
        // Wait for potential saveData call to resolve/reject
        await waitFor(() => {
            expect(saveData).toHaveBeenCalled(); // Save effect proceeds because second init succeeded
        });
        
        // Check that the load error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading auto-refresh settings:', dbError);
        
        // Final state check (error might be null if save succeeds, or save error)
        expect(result.current.autoRefresh).toBe(false); // State remains default
        expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
        // We primarily care that the load error was logged, final error state is secondary here
        // expect(result.current.error).toBe('...'); // This could vary
    });
  });

  describe('State Updates & IndexedDB Saving', () => {
    it('should update autoRefresh state and save to DB', async () => {
      const { result } = renderAutoRefreshHook();
      
      await act(async () => { await jest.runAllTimersAsync(); });
      await waitFor(() => expect(saveData).toHaveBeenCalledTimes(2)); 
      saveData.mockClear();

      act(() => {
        result.current.setAutoRefresh(true);
      });
      expect(result.current.autoRefresh).toBe(true);
      
      await waitFor(() => {
        // Effect saves both keys when triggered
        expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, { key: AUTO_REFRESH_KEY, value: true });
        expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, { key: REFRESH_INTERVAL_KEY, value: DEFAULT_INTERVAL });
      });
      expect(saveData).toHaveBeenCalledTimes(2); 
      saveData.mockClear();
      
      act(() => {
        result.current.setAutoRefresh(false);
      });
      expect(result.current.autoRefresh).toBe(false);
      
      await waitFor(() => {
         // Effect saves both keys when triggered
        expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, { key: AUTO_REFRESH_KEY, value: false });
        expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, { key: REFRESH_INTERVAL_KEY, value: DEFAULT_INTERVAL });
      });
      expect(saveData).toHaveBeenCalledTimes(2);
    });
    
    it('should update refreshInterval state and save to DB', async () => {
        const { result } = renderAutoRefreshHook();
        const newInterval = 45;
        
        await act(async () => { await jest.runAllTimersAsync(); });
        await waitFor(() => expect(saveData).toHaveBeenCalledTimes(2));
        saveData.mockClear();

        act(() => {
            result.current.setRefreshInterval(newInterval);
        });
        expect(result.current.refreshInterval).toBe(newInterval);
        expect(result.current.refreshCountdown).toBe(DEFAULT_INTERVAL);
        
        await waitFor(() => {
            // Effect saves both keys when triggered
            expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, { key: AUTO_REFRESH_KEY, value: false }); // autoRefresh is still false initially
            expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, { key: REFRESH_INTERVAL_KEY, value: newInterval });
        });
        expect(saveData).toHaveBeenCalledTimes(2);
    });
    
    it('should reset countdown when interval changes while autoRefresh is ON', async () => {
        // Load with autoRefresh ON
        getData.mockResolvedValueOnce({ key: AUTO_REFRESH_KEY, value: true });
        const { result } = renderAutoRefreshHook();
        await act(async () => { await jest.runAllTimersAsync(); });
        saveData.mockClear();
        
        expect(result.current.autoRefresh).toBe(true);
        expect(result.current.refreshCountdown).toBe(DEFAULT_INTERVAL);

        // Change interval
        const newInterval = 15;
        act(() => {
            result.current.setRefreshInterval(newInterval);
        });
        
        expect(result.current.refreshInterval).toBe(newInterval);
        // Countdown should immediately reset because autoRefresh is ON
        expect(result.current.refreshCountdown).toBe(newInterval);
        await waitFor(() => { 
            expect(saveData).toHaveBeenCalledWith(MOCK_DB, STORE_NAMES.SETTINGS, { key: REFRESH_INTERVAL_KEY, value: newInterval });
        });
    });

    it('should ignore invalid values for setRefreshInterval and log warning', async () => {
      const { result } = renderAutoRefreshHook();
      await act(async () => { await jest.runAllTimersAsync(); });
      saveData.mockClear();

      act(() => {
        result.current.setRefreshInterval('invalid');
      });
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid refresh interval, using default instead');
      // Save should NOT be called because the state value didn't change
      // Use a small delay to ensure effect would have run if triggered
      await act(async () => { await jest.advanceTimersByTimeAsync(10); }); 
      expect(saveData).not.toHaveBeenCalled();
      
      consoleWarnSpy.mockClear();
      
      act(() => {
        result.current.setRefreshInterval(-10);
      });
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid refresh interval, using default instead');
      await act(async () => { await jest.advanceTimersByTimeAsync(10); });
      expect(saveData).not.toHaveBeenCalled();
    });
    
    it('should handle IndexedDB save errors gracefully', async () => {
        const dbSaveError = new Error('DB Save Failed');
        saveData.mockRejectedValue(dbSaveError);
        
        const { result } = renderAutoRefreshHook();
        await act(async () => { await jest.runAllTimersAsync(); }); // Wait for initial load/save attempt
        
        // Check error state after initial save attempt fails
        await waitFor(() => expect(result.current.error).not.toBeNull());
        expect(result.current.error).toBe('Failed to save auto-refresh settings');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving auto-refresh settings:', dbSaveError);
        consoleErrorSpy.mockClear();
        
        // Trigger another save by changing state
        act(() => {
            result.current.setAutoRefresh(true);
        });
        
        // Wait for the second save attempt to fail
        await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledTimes(1));
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving auto-refresh settings:', dbSaveError);
        expect(result.current.error).toBe('Failed to save auto-refresh settings'); // Error state persists/updates
    });
  });

  describe('Countdown, Refresh Logic & Visibility', () => {
    it('should not start countdown if autoRefresh is false', async () => {
      const { result } = renderAutoRefreshHook();
      
      // Advance time, but countdown shouldn't change
      act(() => { jest.advanceTimersByTime(5000); });
      
      // Need to re-render or access latest state somehow if not using waitFor
      // Re-rendering is simpler here
      const { result: updatedResult } = renderHook(() => useAutoRefresh(mockOnRefresh, DEFAULT_INTERVAL), { initialProps: result.current });
      
      expect(updatedResult.current.refreshCountdown).toBe(DEFAULT_INTERVAL);
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('should countdown and trigger refresh when autoRefresh is true', async () => {
      const interval = 5;
      const { result } = renderAutoRefreshHook(interval);
      await act(async () => { await jest.runAllTimersAsync(); }); // Initial load

      act(() => { result.current.setAutoRefresh(true); });
      expect(result.current.autoRefresh).toBe(true);
      expect(result.current.refreshCountdown).toBe(interval);

      // Advance time by 1 second
      act(() => { jest.advanceTimersByTime(1000); });
      expect(result.current.refreshCountdown).toBe(interval - 1);
      expect(mockOnRefresh).not.toHaveBeenCalled();
      
      // Advance time just before refresh
      act(() => { jest.advanceTimersByTime(3000); }); // Total 4 seconds advanced
      expect(result.current.refreshCountdown).toBe(interval - 4);
      expect(mockOnRefresh).not.toHaveBeenCalled();
      
      // Advance time past the interval
      act(() => { jest.advanceTimersByTime(1000); }); // Total 5 seconds advanced
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.refreshCountdown).toBe(interval); // Countdown resets
      
      // Advance time again
      act(() => { jest.advanceTimersByTime(5000); });
      expect(mockOnRefresh).toHaveBeenCalledTimes(2); // Second refresh triggered
      expect(result.current.refreshCountdown).toBe(interval);
    });

    it('should pause countdown when tab becomes hidden', async () => {
        const interval = 10;
        const { result } = renderAutoRefreshHook(interval);
        await act(async () => { await jest.runAllTimersAsync(); });
        act(() => { result.current.setAutoRefresh(true); });
        expect(result.current.refreshCountdown).toBe(interval);
        
        // Advance time while visible
        act(() => { jest.advanceTimersByTime(3000); });
        expect(result.current.refreshCountdown).toBe(interval - 3);
        
        // Hide tab
        act(() => { mockVisibility('hidden'); });
        
        // Advance time while hidden - countdown should NOT change
        act(() => { jest.advanceTimersByTime(5000); });
        expect(result.current.refreshCountdown).toBe(interval - 3); 
        expect(mockOnRefresh).not.toHaveBeenCalled(); 
    });

    it('should resume countdown and refresh when tab becomes visible again', async () => {
      const interval = 5;
      const { result } = renderAutoRefreshHook(interval);
      await act(async () => { await jest.runAllTimersAsync(); });
      act(() => { result.current.setAutoRefresh(true); });
      
      act(() => { jest.advanceTimersByTime(2000); }); // Countdown = 3
      expect(result.current.refreshCountdown).toBe(interval - 2);

      // Hide tab and advance time past refresh point
      act(() => { 
          mockVisibility('hidden'); 
          jest.advanceTimersByTime(10000); // Advance well past refresh time
      }); 
      expect(result.current.refreshCountdown).toBe(interval - 2); // Still paused
      expect(mockOnRefresh).not.toHaveBeenCalled(); // Refresh shouldn't happen while hidden
      
      // Make tab visible again
      act(() => { mockVisibility('visible'); });
      
      // Countdown should continue from where it paused
      act(() => { jest.advanceTimersByTime(1000); }); // Now at 3 seconds elapsed
      expect(result.current.refreshCountdown).toBe(interval - 3);
      expect(mockOnRefresh).not.toHaveBeenCalled();
      
      act(() => { jest.advanceTimersByTime(2000); }); // Now at 5 seconds elapsed
      expect(mockOnRefresh).toHaveBeenCalledTimes(1); // Refresh should trigger
      expect(result.current.refreshCountdown).toBe(interval); // Resets
    });
    
    it('should handle errors in the onRefresh callback gracefully', async () => {
        const interval = 2;
        const refreshError = new Error('Refresh Failed');
        // Mock onRefresh to THROW synchronously
        mockOnRefresh.mockImplementation(() => { 
            throw refreshError; 
        });
        
        const { result } = renderAutoRefreshHook(interval);
        await act(async () => { await jest.runAllTimersAsync(); });
        act(() => { result.current.setAutoRefresh(true); });

        // Advance timers past the interval
        act(() => {
            jest.advanceTimersByTime(interval * 1000 + 100); 
        });
        
        // No need to wait for microtasks if error is sync
        // await act(async () => {
        //     await Promise.resolve(); 
        // });

        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error in refresh callback:', refreshError);
        // Check error state WAS set by the catch block
        expect(result.current.error).toBe('Error occurred during auto-refresh');
        expect(result.current.refreshCountdown).toBe(interval);
    });
    
    it('should clear interval on unmount', () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        const { result, unmount } = renderAutoRefreshHook(); // Capture result
        act(() => { result.current.setAutoRefresh(true); }); // Start timer
        
        const initialIntervalCalls = clearIntervalSpy.mock.calls.length;
        
        unmount();
        
        // Check that clearInterval was called at least one more time than initially
        expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(initialIntervalCalls);
        clearIntervalSpy.mockRestore();
    });
    
    it('should remove visibility listener on unmount', () => {
        const { unmount } = renderAutoRefreshHook(); // Removed unused result
        
        // Capture the listener function used in addEventListener
        const listenerArgs = document.addEventListener.mock.calls.find(call => call[0] === 'visibilitychange');
        const visibilityCallback = listenerArgs ? listenerArgs[1] : null;
        
        expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', visibilityCallback);
        
        unmount();
        
        // Assert removeEventListener was called with the *same* callback
        expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', visibilityCallback);
    });
  });

}); // End describe useAutoRefresh
