import { renderHook, act } from '@testing-library/react';
import { useSortState } from '@/hooks/useSortState';

describe('useSortState Hook', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSortState());
    expect(result.current.sortState).toEqual({ field: 'age', direction: 'desc' });
  });

  it('should initialize with provided values', () => {
    const { result } = renderHook(() => useSortState('tvl', 'asc'));
    expect(result.current.sortState).toEqual({ field: 'tvl', direction: 'asc' });
  });

  describe('handleSort', () => {
    it('should update field and keep direction when sorting by a new field', () => {
      const { result } = renderHook(() => useSortState('age', 'desc'));

      act(() => {
        result.current.handleSort('tvl');
      });

      expect(result.current.sortState).toEqual({ field: 'tvl', direction: 'desc' });
    });

    it('should toggle direction when sorting by the same field (desc to asc)', () => {
      const { result } = renderHook(() => useSortState('age', 'desc'));

      act(() => {
        result.current.handleSort('age');
      });

      expect(result.current.sortState).toEqual({ field: 'age', direction: 'asc' });
    });

    it('should toggle direction when sorting by the same field (asc to desc)', () => {
      const { result } = renderHook(() => useSortState('age', 'asc'));

      act(() => {
        result.current.handleSort('age');
      });

      expect(result.current.sortState).toEqual({ field: 'age', direction: 'desc' });
    });

     it('should handle multiple sorts correctly', () => {
      const { result } = renderHook(() => useSortState('age', 'desc'));

      // Sort by new field 'tvl' -> { field: 'tvl', direction: 'desc' }
      act(() => {
        result.current.handleSort('tvl');
      });
      expect(result.current.sortState).toEqual({ field: 'tvl', direction: 'desc' });

      // Sort by same field 'tvl' -> { field: 'tvl', direction: 'asc' }
      act(() => {
        result.current.handleSort('tvl');
      });
      expect(result.current.sortState).toEqual({ field: 'tvl', direction: 'asc' });

       // Sort by new field 'fee' -> { field: 'fee', direction: 'asc' }
      act(() => {
        result.current.handleSort('fee');
      });
      expect(result.current.sortState).toEqual({ field: 'fee', direction: 'asc' });

      // Sort by same field 'fee' -> { field: 'fee', direction: 'desc' }
      act(() => {
        result.current.handleSort('fee');
      });
      expect(result.current.sortState).toEqual({ field: 'fee', direction: 'desc' });
    });
  });

  describe('getSortIcon', () => {
    it('should return default icon for non-sorted field', () => {
      const { result } = renderHook(() => useSortState('age', 'desc'));
      expect(result.current.getSortIcon('tvl')).toBe('↕');
    });

    it('should return down arrow for current field sorted desc', () => {
      const { result } = renderHook(() => useSortState('age', 'desc'));
      expect(result.current.getSortIcon('age')).toBe('↓');
    });

    it('should return up arrow for current field sorted asc', () => {
      const { result } = renderHook(() => useSortState('age', 'asc'));
      expect(result.current.getSortIcon('age')).toBe('↑');
    });

     it('should update icon after sorting', () => {
      const { result } = renderHook(() => useSortState('age', 'desc'));

      expect(result.current.getSortIcon('age')).toBe('↓'); // Initial
      expect(result.current.getSortIcon('tvl')).toBe('↕'); // Initial other

      // Sort by tvl
      act(() => {
        result.current.handleSort('tvl');
      });

      expect(result.current.getSortIcon('age')).toBe('↕'); // Now age is not sorted field
      expect(result.current.getSortIcon('tvl')).toBe('↓'); // TVL is sorted desc

      // Sort by tvl again (toggle direction)
       act(() => {
        result.current.handleSort('tvl');
      });
       expect(result.current.getSortIcon('tvl')).toBe('↑'); // TVL is sorted asc
    });
  });
}); 