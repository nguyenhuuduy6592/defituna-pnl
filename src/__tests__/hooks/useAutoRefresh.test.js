import { renderHook, act } from '@testing-library/react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

// Mocks
let getItemSpy;
let setItemSpy;
let consoleErrorSpy;
let consoleWarnSpy;
let addEventListenerSpy;
let removeEventListenerSpy;
let visibilityStateGetter;
let mockOnRefresh;

const DEFAULT_INTERVAL = 30;
const AUTO_REFRESH_KEY = 'autoRefresh';
const REFRESH_INTERVAL_KEY = 'refreshInterval';

// Helper to simulate visibility change
const simulateVisibilityChange = (visibility) => {
  visibilityStateGetter.mockReturnValue(visibility);
  // Need to manually trigger the event listener callback
  const visibilityChangeCallback = addEventListenerSpy.mock.calls.find(
    call => call[0] === 'visibilitychange'
  )?.[1];
  if (visibilityChangeCallback) {
    visibilityChangeCallback();
  }
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  localStorage.clear();

  getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
  setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  addEventListenerSpy = jest.spyOn(document, 'addEventListener');
  removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
  
  // Mock document.visibilityState getter
  visibilityStateGetter = jest.spyOn(document, 'visibilityState', 'get');
  visibilityStateGetter.mockReturnValue('visible'); // Default to visible

  mockOnRefresh = jest.fn();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  // Restore all spies
  getItemSpy.mockRestore();
  setItemSpy.mockRestore();
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
  addEventListenerSpy.mockRestore();
  removeEventListenerSpy.mockRestore();
  visibilityStateGetter.mockRestore();
});

describe('useAutoRefresh Hook', () => {
  describe('Initialization', () => {
    it('should initialize with default values and load from empty localStorage', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));

      expect(result.current.autoRefresh).toBe(false);
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      expect(result.current.refreshCountdown).toBe(DEFAULT_INTERVAL);
      expect(result.current.error).toBeNull();

      expect(getItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY);
      expect(getItemSpy).toHaveBeenCalledWith(REFRESH_INTERVAL_KEY);
      // Initial saves triggered by state setting
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'false');
      expect(setItemSpy).toHaveBeenCalledWith(REFRESH_INTERVAL_KEY, String(DEFAULT_INTERVAL));
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('should initialize with provided initialInterval', () => {
       const customInterval = 60;
       const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, customInterval));

       expect(result.current.refreshInterval).toBe(customInterval);
       expect(result.current.refreshCountdown).toBe(customInterval);
       expect(setItemSpy).toHaveBeenCalledWith(REFRESH_INTERVAL_KEY, String(customInterval));
    });

    it('should load valid settings from localStorage', () => {
      localStorage.setItem(AUTO_REFRESH_KEY, 'true');
      localStorage.setItem(REFRESH_INTERVAL_KEY, '15');
      // Mock getItem to return these values
      getItemSpy.mockImplementation((key) => {
        if (key === AUTO_REFRESH_KEY) return 'true';
        if (key === REFRESH_INTERVAL_KEY) return '15';
        return null;
      });

      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));

      expect(result.current.autoRefresh).toBe(true);
      expect(result.current.refreshInterval).toBe(15);
      expect(result.current.refreshCountdown).toBe(15); // Should initialize countdown to interval
      expect(result.current.error).toBeNull();
      // Should save loaded values back initially (due to state setting triggering effect)
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'true');
      expect(setItemSpy).toHaveBeenCalledWith(REFRESH_INTERVAL_KEY, '15');
    });

     it('should handle invalid interval in localStorage (use default)', () => {
      localStorage.setItem(AUTO_REFRESH_KEY, 'true');
      localStorage.setItem(REFRESH_INTERVAL_KEY, '-10'); // Invalid interval
      getItemSpy.mockImplementation((key) => {
        if (key === AUTO_REFRESH_KEY) return 'true';
        if (key === REFRESH_INTERVAL_KEY) return '-10';
        return null;
      });

      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));

      expect(result.current.autoRefresh).toBe(true); // Still loads autoRefresh correctly
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL); // Falls back to default
      expect(result.current.refreshCountdown).toBe(DEFAULT_INTERVAL); // Uses default
      expect(result.current.error).toBeNull(); 
       // Saves default interval back
      expect(setItemSpy).toHaveBeenCalledWith(REFRESH_INTERVAL_KEY, String(DEFAULT_INTERVAL));
    });

     it('should handle non-numeric interval in localStorage (use default)', () => {
      localStorage.setItem(REFRESH_INTERVAL_KEY, 'abc'); 
      getItemSpy.mockImplementation((key) => {
        if (key === REFRESH_INTERVAL_KEY) return 'abc';
        return null;
      });

      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));

      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      expect(result.current.refreshCountdown).toBe(DEFAULT_INTERVAL);
      expect(setItemSpy).toHaveBeenCalledWith(REFRESH_INTERVAL_KEY, String(DEFAULT_INTERVAL));
    });

    it('should handle localStorage.getItem error during load', () => {
      const loadError = new Error('LocalStorage Read Failed');
      getItemSpy.mockImplementation(() => { throw loadError; });

      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));

      expect(result.current.autoRefresh).toBe(false); // Defaults
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      // Error gets overwritten by subsequent successful save effect
      expect(result.current.error).toBeNull(); 
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading auto-refresh settings:', loadError);
    });
  });

  describe('State Updates & localStorage', () => {
    it('should update autoRefresh state and save to localStorage', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));
      // Expect initial saves
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'false');
      expect(setItemSpy).toHaveBeenCalledWith(REFRESH_INTERVAL_KEY, String(DEFAULT_INTERVAL));
      const initialSaveCount = setItemSpy.mock.calls.length; 

      act(() => { result.current.setAutoRefresh(true); });
      expect(result.current.autoRefresh).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'true');
      // Initial render saves 2 times. Setting autoRefresh triggers save effect again (saves both dependencies).
      expect(setItemSpy).toHaveBeenCalledTimes(initialSaveCount + 2);

      act(() => { result.current.setAutoRefresh(false); });
      expect(result.current.autoRefresh).toBe(false);
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'false');
      // One more save effect trigger (saves both dependencies again)
      expect(setItemSpy).toHaveBeenCalledTimes(initialSaveCount + 4);
    });

     it('should handle truthy/falsy values for setAutoRefresh', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));
      setItemSpy.mockClear();

      act(() => { result.current.setAutoRefresh(1); }); // Truthy
      expect(result.current.autoRefresh).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'true');

       act(() => { result.current.setAutoRefresh(0); }); // Falsy
      expect(result.current.autoRefresh).toBe(false);
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'false');
    });

    it('should update refreshInterval state and save to localStorage', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));
      setItemSpy.mockClear();

      act(() => { result.current.setRefreshInterval(10); });
      expect(result.current.refreshInterval).toBe(10);
      // Save effect saves both autoRefresh and refreshInterval
      expect(setItemSpy).toHaveBeenCalledWith(REFRESH_INTERVAL_KEY, '10');
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'false'); // Assuming default autoRefresh
      expect(setItemSpy).toHaveBeenCalledTimes(2); 
    });

     it('should reset countdown when refreshInterval changes while autoRefresh is true', () => {
      localStorage.setItem(AUTO_REFRESH_KEY, 'true');
      getItemSpy.mockImplementation((key) => key === AUTO_REFRESH_KEY ? 'true' : null);
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 60));
      
      expect(result.current.autoRefresh).toBe(true);
      expect(result.current.refreshInterval).toBe(60);
      expect(result.current.refreshCountdown).toBe(60);

      // Advance time a bit
      act(() => { jest.advanceTimersByTime(5000); });
      expect(result.current.refreshCountdown).toBe(55);

      // Change interval
      act(() => { result.current.setRefreshInterval(15); });
      expect(result.current.refreshInterval).toBe(15);
      expect(result.current.refreshCountdown).toBe(15); // Countdown should reset
    });

     it('should NOT reset countdown when refreshInterval changes while autoRefresh is false', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 60));
      expect(result.current.autoRefresh).toBe(false);
      expect(result.current.refreshInterval).toBe(60);
      expect(result.current.refreshCountdown).toBe(60);

      // Change interval
      act(() => { result.current.setRefreshInterval(15); });
      expect(result.current.refreshInterval).toBe(15);
      expect(result.current.refreshCountdown).toBe(60); // Countdown should NOT reset
    });

    it('should reset countdown when autoRefresh is enabled', () => {
       const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 45));
       expect(result.current.autoRefresh).toBe(false);
       expect(result.current.refreshCountdown).toBe(45);

       // Enable auto-refresh
       act(() => { result.current.setAutoRefresh(true); });
       expect(result.current.autoRefresh).toBe(true);
       expect(result.current.refreshCountdown).toBe(45); // Resets to current interval
    });

    it('should handle invalid values for setRefreshInterval (warn and use default)', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));
      setItemSpy.mockClear();
      consoleWarnSpy.mockClear();

      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      // Clear the spy *after* initial render and potential saves
      setItemSpy.mockClear();

      act(() => { result.current.setRefreshInterval(-5); });

      // Expect console.warn to be called because the value is invalid
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid refresh interval, using default instead'
      );
      // Check that the state remained the default value
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      // Check that setItemSpy was NOT called, as the state didn't change from the default
      expect(setItemSpy).not.toHaveBeenCalled();

      // Reset the console spy for the next call
      consoleWarnSpy.mockClear();

      act(() => { result.current.setRefreshInterval(0); });
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid refresh interval, using default instead'
      );
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      // Check that setItemSpy was still NOT called
      expect(setItemSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

     it('should handle localStorage.setItem error during save', () => {
      const saveError = new Error('LocalStorage Write Failed');
      setItemSpy.mockImplementation(() => { throw saveError; });

      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));

      // Trigger save by changing state
      act(() => { result.current.setAutoRefresh(true); });
      expect(result.current.error).toBe('Failed to save auto-refresh settings');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving auto-refresh settings:', saveError);
    });
  });

  describe('Countdown & Refresh Logic', () => {
    it('should decrement countdown when autoRefresh is true and visible', () => {
      localStorage.setItem(AUTO_REFRESH_KEY, 'true');
      getItemSpy.mockImplementation((key) => key === AUTO_REFRESH_KEY ? 'true' : null);
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 5));
      expect(result.current.autoRefresh).toBe(true);
      expect(result.current.refreshCountdown).toBe(5);

      act(() => { jest.advanceTimersByTime(1000); });
      expect(result.current.refreshCountdown).toBe(4);
      act(() => { jest.advanceTimersByTime(3000); });
      expect(result.current.refreshCountdown).toBe(1);
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('should call onRefresh and reset countdown when timer reaches <= 1 and visible', () => {
      localStorage.setItem(AUTO_REFRESH_KEY, 'true');
      getItemSpy.mockImplementation((key) => key === AUTO_REFRESH_KEY ? 'true' : null);
      const interval = 3;
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, interval));

      act(() => { jest.advanceTimersByTime(2000); }); // Countdown = 1
      expect(result.current.refreshCountdown).toBe(1);
      expect(mockOnRefresh).not.toHaveBeenCalled();

      act(() => { jest.advanceTimersByTime(1000); }); // Countdown <= 1, refresh triggers
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.refreshCountdown).toBe(interval); // Resets

      // Should continue counting down
       act(() => { jest.advanceTimersByTime(1000); });
       expect(result.current.refreshCountdown).toBe(interval - 1);
    });

    it('should NOT decrement or refresh when autoRefresh is false', () => {
       const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 5));
       expect(result.current.autoRefresh).toBe(false);
       const initialCountdown = result.current.refreshCountdown;

       act(() => { jest.advanceTimersByTime(10000); }); // Advance well past interval

       expect(result.current.refreshCountdown).toBe(initialCountdown);
       expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('should NOT call onRefresh when timer reaches zero but tab is hidden', () => {
      localStorage.setItem(AUTO_REFRESH_KEY, 'true');
      getItemSpy.mockImplementation((key) => key === AUTO_REFRESH_KEY ? 'true' : null);
      const interval = 3;
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, interval));

      simulateVisibilityChange('hidden'); // Hide the tab

      act(() => { jest.advanceTimersByTime(3000); }); // Timer reaches zero
      
      expect(mockOnRefresh).not.toHaveBeenCalled();
      expect(result.current.refreshCountdown).toBe(interval); // Still resets
    });

    it('should resume countdown and refresh when tab becomes visible again', () => {
      localStorage.setItem(AUTO_REFRESH_KEY, 'true');
      getItemSpy.mockImplementation((key) => key === AUTO_REFRESH_KEY ? 'true' : null);
      const interval = 5;
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, interval));

      simulateVisibilityChange('hidden');
      act(() => { jest.advanceTimersByTime(10000); }); // Time passes, refresh didn't happen
      expect(mockOnRefresh).not.toHaveBeenCalled();
      expect(result.current.refreshCountdown).toBe(interval);

      simulateVisibilityChange('visible');
      // Countdown should restart from the interval
      act(() => { jest.advanceTimersByTime(4000); }); 
      expect(result.current.refreshCountdown).toBe(1);
      expect(mockOnRefresh).not.toHaveBeenCalled();
      
      act(() => { jest.advanceTimersByTime(1000); }); // Refresh triggers
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.refreshCountdown).toBe(interval);
    });

    it('should handle errors in the onRefresh callback', () => {
      localStorage.setItem(AUTO_REFRESH_KEY, 'true');
      getItemSpy.mockImplementation((key) => key === AUTO_REFRESH_KEY ? 'true' : null);
      const refreshError = new Error('Refresh Failed!');
      mockOnRefresh.mockImplementation(() => { throw refreshError; });
      const interval = 2;
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, interval));

      act(() => { jest.advanceTimersByTime(2000); }); // Trigger refresh

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBe('Error occurred during auto-refresh');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in refresh callback:', refreshError);
      expect(result.current.refreshCountdown).toBe(interval); // Still resets countdown
    });
  });

  describe('Cleanup', () => {
    it('should clear interval and remove visibility listener on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      localStorage.setItem(AUTO_REFRESH_KEY, 'true'); // Ensure timer starts
      getItemSpy.mockImplementation((key) => key === AUTO_REFRESH_KEY ? 'true' : null);

      const { unmount } = renderHook(() => useAutoRefresh(mockOnRefresh, 10));

      // Ensure timer and listener were set up
      const initialIntervalCalls = clearIntervalSpy.mock.calls.length;
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      const visibilityCallback = addEventListenerSpy.mock.calls.find(call => call[0] === 'visibilitychange')[1];

      unmount();

      // Check if timer was cleared (note: intervals might be cleared/reset internally on state changes too)
      // We expect at least one more clear call specifically from the unmount effect cleanup.
      expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(initialIntervalCalls);
      
      // Check if listener was removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', visibilityCallback);

      clearIntervalSpy.mockRestore();
    });
  });
}); 