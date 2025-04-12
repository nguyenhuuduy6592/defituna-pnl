import { renderHook, act } from '@testing-library/react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { initializeDB, getData, saveData } from '@/utils/indexedDB';
import { postMessageToSW } from '@/utils/serviceWorkerUtils';

// Mock dependencies
jest.mock('@/utils/indexedDB');
jest.mock('@/utils/serviceWorkerUtils');

describe('useAutoRefresh', () => {
  // Mock implementation and setup
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful DB initialization
    initializeDB.mockResolvedValue({});
    
    // Mock successful data saves
    saveData.mockResolvedValue(true);

    // Mock service worker
    const mockServiceWorker = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    // Mock navigator.serviceWorker
    Object.defineProperty(window, 'navigator', {
      value: {
        serviceWorker: mockServiceWorker
      },
      writable: true
    });
  });

  it('should initialize with default values', async () => {
    getData.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAutoRefresh());

    // Initial state should be default values
    expect(result.current.autoRefresh).toBe(false);
    expect(result.current.refreshInterval).toBe(30);
    expect(result.current.refreshCountdown).toBe(30);
    expect(result.current.error).toBe(null);
  });

  it('should load saved settings from IndexedDB', async () => {
    getData.mockImplementation((db, store, key) => {
      if (key === 'autoRefresh') return Promise.resolve({ value: true });
      if (key === 'refreshInterval') return Promise.resolve({ value: 60 });
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useAutoRefresh());

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.autoRefresh).toBe(true);
    expect(result.current.refreshInterval).toBe(60);
    expect(result.current.refreshCountdown).toBe(60);
  });

  it('should handle IndexedDB initialization failure', async () => {
    initializeDB.mockRejectedValueOnce(new Error('DB Init Failed'));

    const { result } = renderHook(() => useAutoRefresh());

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Failed to load auto-refresh settings');
  });

  it('should update auto-refresh state and save to IndexedDB', async () => {
    getData.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useAutoRefresh());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Update auto-refresh state
    await act(async () => {
      result.current.setAutoRefresh(true);
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current.autoRefresh).toBe(true);
    expect(saveData).toHaveBeenCalledWith(
      expect.anything(),
      'settings',
      { key: 'autoRefresh', value: true }
    );
    expect(postMessageToSW).toHaveBeenCalledWith({ type: 'START_SYNC' });
  });

  it('should update refresh interval and save to IndexedDB', async () => {
    getData.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useAutoRefresh());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Update interval
    await act(async () => {
      result.current.setRefreshInterval(45);
      // Wait for state updates and debounce
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current.refreshInterval).toBe(45);
    expect(result.current.refreshCountdown).toBe(45);
    expect(saveData).toHaveBeenCalledWith(
      expect.anything(),
      'settings',
      { key: 'refreshInterval', value: 45 }
    );
    expect(postMessageToSW).toHaveBeenCalledWith({ type: 'SET_INTERVAL', interval: 45 });
  });

  it('should handle invalid refresh interval input', async () => {
    getData.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useAutoRefresh());

    await act(async () => {
      result.current.setRefreshInterval('invalid');
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current.refreshInterval).toBe(30); // Should use default
  });
});
