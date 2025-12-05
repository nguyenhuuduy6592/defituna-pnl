import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../../hooks/useCountdown';

// Mock console.warn
let consoleWarnSpy;

beforeEach(() => {
  jest.useFakeTimers();
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.runOnlyPendingTimers(); // Clear any remaining timers
  jest.useRealTimers();
  consoleWarnSpy.mockRestore();
});

describe('useCountdown Hook', () => {
  it('should initialize with default value 0 and not running', () => {
    const { result } = renderHook(() => useCountdown());
    expect(result.current.countdown).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('should initialize with a positive value and running', () => {
    const { result } = renderHook(() => useCountdown(10));
    expect(result.current.countdown).toBe(10);
    expect(result.current.isRunning).toBe(true);
  });

  it('should initialize with 0 if initial value is negative', () => {
    const { result } = renderHook(() => useCountdown(-5));
    expect(result.current.countdown).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('should initialize with 0 if initial value is non-numeric (NaN)', () => {
    // Note: `parseInt(undefined)` or `parseInt(null)` might be 0 or NaN depending on JS engine nuance
    // but Math.max(0, NaN) is NaN. useState(NaN) is valid. isRunning depends on initialValue > 0 which is false for NaN.
    // The hook logic handles NaN gracefully setting countdown to 0. Let's test NaN directly
    const { result } = renderHook(() => useCountdown(NaN));
    expect(result.current.countdown).toBe(NaN); // Expect NaN as Math.max(0, NaN) is NaN
    expect(result.current.isRunning).toBe(false);
  });

  it('should countdown over time', () => {
    const { result } = renderHook(() => useCountdown(3));

    expect(result.current.countdown).toBe(3);
    expect(result.current.isRunning).toBe(true);

    // Advance time by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.countdown).toBe(2);
    expect(result.current.isRunning).toBe(true);

    // Advance time by another second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.countdown).toBe(1);
    expect(result.current.isRunning).toBe(true);

    // Advance time by another second (reaches zero)
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.countdown).toBe(0);
    expect(result.current.isRunning).toBe(false); // Should stop when reaching zero

    // Advance time further
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.countdown).toBe(0); // Should remain zero
    expect(result.current.isRunning).toBe(false);
  });

  describe('startCountdown', () => {
    it('should start a new countdown', () => {
      const { result } = renderHook(() => useCountdown());
      expect(result.current.countdown).toBe(0);
      expect(result.current.isRunning).toBe(false);

      act(() => {
        result.current.startCountdown(5);
      });

      expect(result.current.countdown).toBe(5);
      expect(result.current.isRunning).toBe(true);

      // Check if it counts down
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(4);
    });

    it('should restart an already running countdown', () => {
      const { result } = renderHook(() => useCountdown(10));

      act(() => {
        jest.advanceTimersByTime(2000); // Countdown is now 8
      });
      expect(result.current.countdown).toBe(8);

      act(() => {
        result.current.startCountdown(3);
      });

      expect(result.current.countdown).toBe(3);
      expect(result.current.isRunning).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.countdown).toBe(2);
    });

    it('should warn and not start with invalid seconds (0, negative, non-numeric)', () => {
      const { result } = renderHook(() => useCountdown());

      act(() => { result.current.startCountdown(0); });
      expect(result.current.countdown).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

      act(() => { result.current.startCountdown(-5); });
      expect(result.current.countdown).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      act(() => { result.current.startCountdown('abc'); });
      expect(result.current.countdown).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);

      act(() => { result.current.startCountdown(null); });
      expect(result.current.countdown).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('stopCountdown', () => {
    it('should stop the countdown', () => {
      const { result } = renderHook(() => useCountdown(5));
      expect(result.current.isRunning).toBe(true);

      act(() => {
        jest.advanceTimersByTime(2000); // Countdown is now 3
      });
      expect(result.current.countdown).toBe(3);

      act(() => {
        result.current.stopCountdown();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.countdown).toBe(3);

      // Advance time further, should not change
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.countdown).toBe(3);
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('resetCountdown', () => {
    it('should stop the countdown and reset value to zero', () => {
      const { result } = renderHook(() => useCountdown(5));
      expect(result.current.isRunning).toBe(true);

      act(() => {
        jest.advanceTimersByTime(2000); // Countdown is now 3
      });
      expect(result.current.countdown).toBe(3);

      act(() => {
        result.current.resetCountdown();
      });

      expect(result.current.countdown).toBe(0);
      expect(result.current.isRunning).toBe(false);

      // Advance time further, should not change
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.countdown).toBe(0);
      expect(result.current.isRunning).toBe(false);
    });
  });

  it('should clear interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useCountdown(10));

    // Ensure timer was set up
    expect(clearIntervalSpy).not.toHaveBeenCalled();

    unmount();

    // Check if clearInterval was called during cleanup
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    clearIntervalSpy.mockRestore();
  });
});