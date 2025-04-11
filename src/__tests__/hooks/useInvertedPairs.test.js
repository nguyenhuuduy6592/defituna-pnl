import { renderHook, act } from '@testing-library/react';
import { useInvertedPairs } from '@/hooks/useInvertedPairs';
// No need to import the mock directly, it's applied globally via jest.setup.js
// import mockIndexedDB from '../../jest.setup'; 
import { getData, saveData, STORE_NAMES } from '@/utils/indexedDB'; // Import the actual functions (they are mocked)

// Helper to reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Ensure getData returns null by default (simulating empty DB)
  getData.mockImplementation(() => Promise.resolve(null)); 
  saveData.mockResolvedValue(true);
});

describe('useInvertedPairs Hook', () => {
  it('should initialize with an empty Set if IndexedDB is empty', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useInvertedPairs());
    
    // Wait for initial effect to load from DB
    await act(async () => {
      // Need to check if waitForNextUpdate exists before calling
      if (waitForNextUpdate) await waitForNextUpdate();
    });

    expect(result.current.invertedPairs).toEqual(new Set());
    expect(getData).toHaveBeenCalledWith(expect.anything(), STORE_NAMES.SETTINGS, 'invertedPairs');
    // Initial render might trigger useEffect for saveData with empty array
    expect(saveData).toHaveBeenCalledWith(expect.anything(), STORE_NAMES.SETTINGS, { 
      key: 'invertedPairs', 
      value: [] 
    });
  });

  it('should initialize with data from IndexedDB', async () => {
    const initialPairs = ['PAIR1', 'PAIR2'];
    getData.mockResolvedValue({ value: initialPairs });

    const { result, waitForNextUpdate } = renderHook(() => useInvertedPairs());

    // Wait for initial effect to load from DB
    await act(async () => {
      if (waitForNextUpdate) await waitForNextUpdate();
    });

    expect(result.current.invertedPairs).toEqual(new Set(initialPairs));
    expect(getData).toHaveBeenCalledWith(expect.anything(), STORE_NAMES.SETTINGS, 'invertedPairs');
    // Initial useEffect might rewrite it, but it should be the same value initially
    expect(saveData).toHaveBeenCalledWith(expect.anything(), STORE_NAMES.SETTINGS, { 
      key: 'invertedPairs', 
      value: initialPairs 
    });
  });

  describe('handlePairInversion', () => {
    it('should add a pair to the set and update IndexedDB', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useInvertedPairs());

      // Wait for initial load
      await act(async () => { 
        if (waitForNextUpdate) await waitForNextUpdate();
      });

      // Add PAIR_A
      await act(async () => {
        result.current.handlePairInversion('PAIR_A');
        if (waitForNextUpdate) await waitForNextUpdate(); // Wait for state update & save effect
      });

      expect(result.current.invertedPairs).toEqual(new Set(['PAIR_A']));
      expect(saveData).toHaveBeenCalledTimes(2); // Initial + Add
      expect(saveData).toHaveBeenLastCalledWith(expect.anything(), STORE_NAMES.SETTINGS, { 
        key: 'invertedPairs', 
        value: ['PAIR_A'] 
      });
    });

    it('should remove a pair from the set and update IndexedDB', async () => {
      const initialPairs = ['PAIR_A', 'PAIR_B'];
      getData.mockResolvedValue({ value: initialPairs });

      const { result, waitForNextUpdate } = renderHook(() => useInvertedPairs());

      // Wait for initial load
      await act(async () => { 
        if (waitForNextUpdate) await waitForNextUpdate(); 
      });
      
      // Clear initial saveData call from useEffect
      saveData.mockClear();

      // Remove PAIR_A
      await act(async () => {
        result.current.handlePairInversion('PAIR_A');
        if (waitForNextUpdate) await waitForNextUpdate(); // Wait for state update & save effect
      });

      expect(result.current.invertedPairs).toEqual(new Set(['PAIR_B']));
      expect(saveData).toHaveBeenCalledTimes(1);
      expect(saveData).toHaveBeenCalledWith(expect.anything(), STORE_NAMES.SETTINGS, { 
        key: 'invertedPairs', 
        value: ['PAIR_B'] 
      });
    });

    it('should toggle pairs correctly and update IndexedDB', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useInvertedPairs());

      // Wait for initial load
      await act(async () => { 
        if (waitForNextUpdate) await waitForNextUpdate(); 
      });
      saveData.mockClear(); // Clear initial save

      // Add PAIR_X
      await act(async () => { 
        result.current.handlePairInversion('PAIR_X');
        if (waitForNextUpdate) await waitForNextUpdate(); 
      });
      expect(result.current.invertedPairs).toEqual(new Set(['PAIR_X']));
      expect(saveData).toHaveBeenLastCalledWith(expect.anything(), STORE_NAMES.SETTINGS, { 
        key: 'invertedPairs', 
        value: ['PAIR_X'] 
      });

      // Add PAIR_Y
      await act(async () => { 
        result.current.handlePairInversion('PAIR_Y'); 
        if (waitForNextUpdate) await waitForNextUpdate();
      });
      expect(result.current.invertedPairs).toEqual(new Set(['PAIR_X', 'PAIR_Y']));
      expect(saveData).toHaveBeenLastCalledWith(expect.anything(), STORE_NAMES.SETTINGS, { 
        key: 'invertedPairs', 
        value: ['PAIR_X', 'PAIR_Y'] 
      });

      // Remove PAIR_X
      await act(async () => { 
        result.current.handlePairInversion('PAIR_X'); 
        if (waitForNextUpdate) await waitForNextUpdate(); 
      });
      expect(result.current.invertedPairs).toEqual(new Set(['PAIR_Y']));
      expect(saveData).toHaveBeenLastCalledWith(expect.anything(), STORE_NAMES.SETTINGS, { 
        key: 'invertedPairs', 
        value: ['PAIR_Y'] 
      });
    });
  });

  describe('isInverted', () => {
    it('should return true if pair is in the set', async () => {
      const initialPairs = ['PAIR1', 'PAIR_2'];
      getData.mockResolvedValue({ value: initialPairs });

      const { result, waitForNextUpdate } = renderHook(() => useInvertedPairs());

      // Wait for initial load
      await act(async () => { 
        if (waitForNextUpdate) await waitForNextUpdate(); 
      });

      expect(result.current.isInverted('PAIR1')).toBe(true);
      expect(result.current.isInverted('PAIR_2')).toBe(true);
    });

    it('should return false if pair is not in the set', async () => {
      const initialPairs = ['PAIR1'];
      getData.mockResolvedValue({ value: initialPairs });

      const { result, waitForNextUpdate } = renderHook(() => useInvertedPairs());

      // Wait for initial load
      await act(async () => { 
        if (waitForNextUpdate) await waitForNextUpdate(); 
      });

      expect(result.current.isInverted('PAIR_OTHER')).toBe(false);
    });
  });

  it('should handle IndexedDB getData errors gracefully', async () => {
    const error = new Error('IndexedDB read failed');
    getData.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result, waitForNextUpdate } = renderHook(() => useInvertedPairs());
    
    await act(async () => {
      if (waitForNextUpdate) await waitForNextUpdate();
    });

    expect(result.current.invertedPairs).toEqual(new Set());
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading inverted pairs:', error);
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle IndexedDB saveData errors gracefully', async () => {
    const error = new Error('IndexedDB save failed');
    saveData.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result, waitForNextUpdate } = renderHook(() => useInvertedPairs());

    // Wait for initial load
    await act(async () => { 
      if (waitForNextUpdate) await waitForNextUpdate(); 
    });
    saveData.mockClear(); // Clear initial save

    // Attempt to add a pair
    await act(async () => {
      result.current.handlePairInversion('PAIR_FAIL');
      // We don't necessarily need waitForNextUpdate here as the error happens during save
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving inverted pairs:', error);
    
    consoleErrorSpy.mockRestore();
  });
}); 