import { renderHook, act } from '@testing-library/react';
import { useInvertedPairs } from '../../hooks/useInvertedPairs';

// Mock localStorage
let getItemSpy;
let setItemSpy;

beforeEach(() => {
  // Clear mocks and localStorage before each test
  jest.clearAllMocks();
  localStorage.clear();

  // Spy on localStorage methods
  getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
  setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
});

afterEach(() => {
  // Restore original localStorage methods
  getItemSpy.mockRestore();
  setItemSpy.mockRestore();
});

describe('useInvertedPairs Hook', () => {
  it('should initialize with an empty Set if localStorage is empty', () => {
    const { result } = renderHook(() => useInvertedPairs());
    expect(result.current.invertedPairs).toEqual(new Set());
    expect(getItemSpy).toHaveBeenCalledWith('invertedPairs');
    // Initial render might trigger useEffect for setItem with empty array
    expect(setItemSpy).toHaveBeenCalledWith('invertedPairs', '[]');
  });

  it('should initialize with data from localStorage', () => {
    const initialPairs = ['PAIR1', 'PAIR2'];
    localStorage.setItem('invertedPairs', JSON.stringify(initialPairs));
    getItemSpy.mockReturnValueOnce(JSON.stringify(initialPairs)); // Ensure spy returns the value

    const { result } = renderHook(() => useInvertedPairs());
    expect(result.current.invertedPairs).toEqual(new Set(initialPairs));
    expect(getItemSpy).toHaveBeenCalledWith('invertedPairs');
    // Initial useEffect might rewrite it, but it should be the same value initially
    expect(setItemSpy).toHaveBeenCalledWith(
      'invertedPairs',
      JSON.stringify(initialPairs)
    );
  });

  describe('handlePairInversion', () => {
    it('should add a pair to the set and update localStorage', () => {
      const { result } = renderHook(() => useInvertedPairs());
      expect(result.current.invertedPairs).toEqual(new Set());

      // Clear initial setItem call from useEffect
      setItemSpy.mockClear();

      act(() => {
        result.current.handlePairInversion('PAIR_A');
      });

      expect(result.current.invertedPairs).toEqual(new Set(['PAIR_A']));
      expect(setItemSpy).toHaveBeenCalledTimes(1);
      expect(setItemSpy).toHaveBeenCalledWith(
        'invertedPairs',
        JSON.stringify(['PAIR_A'])
      );
    });

    it('should remove a pair from the set and update localStorage', () => {
      const initialPairs = ['PAIR_A', 'PAIR_B'];
      localStorage.setItem('invertedPairs', JSON.stringify(initialPairs));
      getItemSpy.mockReturnValueOnce(JSON.stringify(initialPairs));

      const { result } = renderHook(() => useInvertedPairs());
      expect(result.current.invertedPairs).toEqual(new Set(initialPairs));

      // Clear initial setItem call from useEffect
      setItemSpy.mockClear();

      act(() => {
        result.current.handlePairInversion('PAIR_A');
      });

      expect(result.current.invertedPairs).toEqual(new Set(['PAIR_B']));
      expect(setItemSpy).toHaveBeenCalledTimes(1);
      expect(setItemSpy).toHaveBeenCalledWith(
        'invertedPairs',
        JSON.stringify(['PAIR_B'])
      );
    });

    it('should toggle pairs correctly and update localStorage', () => {
      const { result } = renderHook(() => useInvertedPairs());
      setItemSpy.mockClear(); // Clear initial setItem

      // Add PAIR_X
      act(() => {
        result.current.handlePairInversion('PAIR_X');
      });
      expect(result.current.invertedPairs).toEqual(new Set(['PAIR_X']));
      expect(setItemSpy).toHaveBeenLastCalledWith(
        'invertedPairs',
        JSON.stringify(['PAIR_X'])
      );

      // Add PAIR_Y
      act(() => {
        result.current.handlePairInversion('PAIR_Y');
      });
      expect(result.current.invertedPairs).toEqual(
        new Set(['PAIR_X', 'PAIR_Y'])
      );
      expect(setItemSpy).toHaveBeenLastCalledWith(
        'invertedPairs',
        JSON.stringify(['PAIR_X', 'PAIR_Y'])
      );

      // Remove PAIR_X
      act(() => {
        result.current.handlePairInversion('PAIR_X');
      });
      expect(result.current.invertedPairs).toEqual(new Set(['PAIR_Y']));
      expect(setItemSpy).toHaveBeenLastCalledWith(
        'invertedPairs',
        JSON.stringify(['PAIR_Y'])
      );

      // Remove PAIR_Y
      act(() => {
        result.current.handlePairInversion('PAIR_Y');
      });
      expect(result.current.invertedPairs).toEqual(new Set([]));
      expect(setItemSpy).toHaveBeenLastCalledWith('invertedPairs', '[]');

      expect(setItemSpy).toHaveBeenCalledTimes(4); // One call per toggle
    });
  });

  describe('isInverted', () => {
    it('should return true if pair is in the set', () => {
      const initialPairs = ['PAIR1', 'PAIR2'];
      localStorage.setItem('invertedPairs', JSON.stringify(initialPairs));
      getItemSpy.mockReturnValueOnce(JSON.stringify(initialPairs));

      const { result } = renderHook(() => useInvertedPairs());
      expect(result.current.isInverted('PAIR1')).toBe(true);
      expect(result.current.isInverted('PAIR2')).toBe(true);
    });

    it('should return false if pair is not in the set', () => {
      const initialPairs = ['PAIR1'];
      localStorage.setItem('invertedPairs', JSON.stringify(initialPairs));
      getItemSpy.mockReturnValueOnce(JSON.stringify(initialPairs));

      const { result } = renderHook(() => useInvertedPairs());
      expect(result.current.isInverted('PAIR_OTHER')).toBe(false);
    });

    it('should reflect changes after handlePairInversion', () => {
      const { result } = renderHook(() => useInvertedPairs());
      expect(result.current.isInverted('NEW_PAIR')).toBe(false);

      act(() => {
        result.current.handlePairInversion('NEW_PAIR');
      });
      expect(result.current.isInverted('NEW_PAIR')).toBe(true);

      act(() => {
        result.current.handlePairInversion('NEW_PAIR');
      });
      expect(result.current.isInverted('NEW_PAIR')).toBe(false);
    });
  });
});
