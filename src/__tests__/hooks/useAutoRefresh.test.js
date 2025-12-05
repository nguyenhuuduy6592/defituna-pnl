import { renderHook, act } from '@testing-library/react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

// Mocks
let getItemSpy;
let setItemSpy;
let consoleErrorSpy;
let consoleWarnSpy;
let mockOnRefresh;

const DEFAULT_INTERVAL = 15;
const AUTO_REFRESH_KEY = 'autoRefresh';
const REFRESH_INTERVAL_KEY = 'refreshInterval';

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  localStorage.clear();

  getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
  setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

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
      expect(setItemSpy).toHaveBeenCalledWith(
        REFRESH_INTERVAL_KEY,
        String(DEFAULT_INTERVAL)
      );
    });

    it('should initialize with provided initialInterval', () => {
      const customInterval = 60;
      const { result } = renderHook(() =>
        useAutoRefresh(mockOnRefresh, customInterval)
      );

      expect(result.current.refreshInterval).toBe(customInterval);
      expect(result.current.refreshCountdown).toBe(customInterval);
      expect(setItemSpy).toHaveBeenCalledWith(
        REFRESH_INTERVAL_KEY,
        String(customInterval)
      );
    });

    it('should load valid settings from localStorage', () => {
      localStorage.setItem(AUTO_REFRESH_KEY, 'true');
      localStorage.setItem(REFRESH_INTERVAL_KEY, '15');
      // Mock getItem to return these values
      getItemSpy.mockImplementation((key) => {
        if (key === AUTO_REFRESH_KEY) {
          return 'true';
        }
        if (key === REFRESH_INTERVAL_KEY) {
          return '15';
        }
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
        if (key === AUTO_REFRESH_KEY) {
          return 'true';
        }
        if (key === REFRESH_INTERVAL_KEY) {
          return '-10';
        }
        return null;
      });

      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));

      expect(result.current.autoRefresh).toBe(true); // Still loads autoRefresh correctly
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL); // Falls back to default
      expect(result.current.refreshCountdown).toBe(DEFAULT_INTERVAL); // Uses default
      expect(result.current.error).toBeNull();
      // Saves default interval back
      expect(setItemSpy).toHaveBeenCalledWith(
        REFRESH_INTERVAL_KEY,
        String(DEFAULT_INTERVAL)
      );
    });

    it('should handle non-numeric interval in localStorage (use default)', () => {
      localStorage.setItem(REFRESH_INTERVAL_KEY, 'abc');
      getItemSpy.mockImplementation((key) => {
        if (key === REFRESH_INTERVAL_KEY) {
          return 'abc';
        }
        return null;
      });

      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));

      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      expect(result.current.refreshCountdown).toBe(DEFAULT_INTERVAL);
      expect(setItemSpy).toHaveBeenCalledWith(
        REFRESH_INTERVAL_KEY,
        String(DEFAULT_INTERVAL)
      );
    });

    it('should handle localStorage.getItem error during load', () => {
      const loadError = new Error('LocalStorage Read Failed');
      getItemSpy.mockImplementation(() => {
        throw loadError;
      });

      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));

      expect(result.current.autoRefresh).toBe(false); // Defaults
      expect(result.current.refreshInterval).toBe(DEFAULT_INTERVAL);
      // Error gets overwritten by subsequent successful save effect
      expect(result.current.error).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading auto-refresh settings:',
        loadError
      );
    });
  });

  describe('State Updates & localStorage', () => {
    it('should update autoRefresh state and save to localStorage', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));
      // Expect initial saves
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'false');
      expect(setItemSpy).toHaveBeenCalledWith(
        REFRESH_INTERVAL_KEY,
        String(DEFAULT_INTERVAL)
      );
      const initialSaveCount = setItemSpy.mock.calls.length;

      act(() => {
        result.current.setAutoRefresh(true);
      });
      expect(result.current.autoRefresh).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'true');
      // Initial render saves 2 times. Setting autoRefresh triggers save effect again (saves both dependencies).
      expect(setItemSpy).toHaveBeenCalledTimes(initialSaveCount + 2);

      act(() => {
        result.current.setAutoRefresh(false);
      });
      expect(result.current.autoRefresh).toBe(false);
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'false');
      // One more save effect trigger (saves both dependencies again)
      expect(setItemSpy).toHaveBeenCalledTimes(initialSaveCount + 4);
    });

    it('should handle truthy/falsy values for setAutoRefresh', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));
      setItemSpy.mockClear();

      act(() => {
        result.current.setAutoRefresh(1);
      }); // Truthy
      expect(result.current.autoRefresh).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'true');

      act(() => {
        result.current.setAutoRefresh(0);
      }); // Falsy
      expect(result.current.autoRefresh).toBe(false);
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'false');
    });

    it('should update refreshInterval state and save to localStorage', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));
      setItemSpy.mockClear();

      act(() => {
        result.current.setRefreshInterval(10);
      });
      expect(result.current.refreshInterval).toBe(10);
      // Save effect saves both autoRefresh and refreshInterval
      expect(setItemSpy).toHaveBeenCalledWith(REFRESH_INTERVAL_KEY, '10');
      expect(setItemSpy).toHaveBeenCalledWith(AUTO_REFRESH_KEY, 'false'); // Assuming default autoRefresh
      expect(setItemSpy).toHaveBeenCalledTimes(2);
    });

    it('should reset countdown when refreshInterval changes while autoRefresh is true', () => {
      localStorage.setItem(AUTO_REFRESH_KEY, 'true');
      getItemSpy.mockImplementation((key) =>
        key === AUTO_REFRESH_KEY ? 'true' : null
      );
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 60));

      expect(result.current.autoRefresh).toBe(true);
      expect(result.current.refreshInterval).toBe(60);
      expect(result.current.refreshCountdown).toBe(60);

      // Advance time a bit
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.refreshCountdown).toBe(55);

      // Change interval
      act(() => {
        result.current.setRefreshInterval(15);
      });
      expect(result.current.refreshInterval).toBe(15);
      expect(result.current.refreshCountdown).toBe(15); // Countdown should reset
    });

    it('should NOT reset countdown when refreshInterval changes while autoRefresh is false', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 60));
      expect(result.current.autoRefresh).toBe(false);
      expect(result.current.refreshInterval).toBe(60);
      expect(result.current.refreshCountdown).toBe(60);

      // Change interval
      act(() => {
        result.current.setRefreshInterval(15);
      });
      expect(result.current.refreshInterval).toBe(15);
      expect(result.current.refreshCountdown).toBe(60); // Countdown should NOT reset
    });

    it('should reset countdown when autoRefresh is enabled', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 45));
      expect(result.current.autoRefresh).toBe(false);
      expect(result.current.refreshCountdown).toBe(45);

      // Enable auto-refresh
      act(() => {
        result.current.setAutoRefresh(true);
      });
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

      act(() => {
        result.current.setRefreshInterval(-5);
      });

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

      act(() => {
        result.current.setRefreshInterval(0);
      });
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
      setItemSpy.mockImplementation(() => {
        throw saveError;
      });

      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh));

      // Trigger save by changing state
      act(() => {
        result.current.setAutoRefresh(true);
      });
      expect(result.current.error).toBe('Failed to save auto-refresh settings');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving auto-refresh settings:',
        saveError
      );
    });
  });

  describe('Auto-Refresh Logic', () => {
    it('should not start timer if autoRefresh is initially false', () => {
      renderHook(() => useAutoRefresh(mockOnRefresh));
      act(() => {
        jest.advanceTimersByTime(DEFAULT_INTERVAL * 1000 + 100);
      });
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('should start timer and call onRefresh when autoRefresh is enabled', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 5));
      act(() => {
        result.current.setAutoRefresh(true);
      });

      // Countdown initial state
      expect(result.current.refreshCountdown).toBe(5);

      // Advance time just before refresh
      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(result.current.refreshCountdown).toBe(1);
      expect(mockOnRefresh).not.toHaveBeenCalled();

      // Advance time past refresh threshold
      act(() => {
        jest.advanceTimersByTime(1);
      }); // Tick to trigger refresh
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.refreshCountdown).toBe(5); // Reset countdown

      // Advance time for another cycle
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(mockOnRefresh).toHaveBeenCalledTimes(2);
      expect(result.current.refreshCountdown).toBe(5);
    });

    it('should stop timer when autoRefresh is disabled', () => {
      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 5));
      act(() => {
        result.current.setAutoRefresh(true);
      });

      // Advance time part way
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.refreshCountdown).toBe(3);
      expect(mockOnRefresh).not.toHaveBeenCalled();

      // Disable auto-refresh
      act(() => {
        result.current.setAutoRefresh(false);
      });

      // Advance time past where refresh would have occurred
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(mockOnRefresh).not.toHaveBeenCalled();
      expect(result.current.refreshCountdown).toBe(3); // Countdown should remain paused
    });

    it('should handle onRefresh callback errors gracefully', () => {
      const refreshError = new Error('Refresh Failed');
      mockOnRefresh.mockImplementation(() => {
        throw refreshError;
      });

      const { result } = renderHook(() => useAutoRefresh(mockOnRefresh, 2));
      act(() => {
        result.current.setAutoRefresh(true);
      });

      // Trigger the refresh that will throw an error
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBe('Error occurred during auto-refresh');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in refresh callback:',
        refreshError
      );
      expect(result.current.refreshCountdown).toBe(2); // Countdown should still reset

      // Ensure timer continues for next cycle
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(mockOnRefresh).toHaveBeenCalledTimes(2); // Called again
      expect(result.current.error).toBe('Error occurred during auto-refresh'); // Error state might persist until next successful cycle or manual clear
    });
  });
});
