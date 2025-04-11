import { renderHook, act } from '@testing-library/react';
import { usePositionAges } from '@/components/pnl/hooks/usePositionAges';

describe('usePositionAges Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should return an empty array when given no positions', () => {
    const { result } = renderHook(() => usePositionAges());
    expect(result.current).toEqual([]);
  });

  it('should return an empty array when given an empty array', () => {
    const { result } = renderHook(() => usePositionAges([]));
    expect(result.current).toEqual([]);
  });
  
  it('should handle non-array input gracefully', () => {
    const { result } = renderHook(() => usePositionAges(null));
    expect(result.current).toEqual([]);
    const { result: result2 } = renderHook(() => usePositionAges(undefined));
    expect(result2.current).toEqual([]);
    const { result: result3 } = renderHook(() => usePositionAges({}));
    expect(result3.current).toEqual([]);
  });

  it('should calculate the age correctly for a valid position', () => {
    const baseTime = new Date('2023-01-01T12:00:00.000Z').getTime();
    jest.setSystemTime(baseTime); // Current time: 12:00:00

    const openedAt = new Date(baseTime - 60 * 1000); // Opened 1 minute ago (11:59:00)
    const positions = [{ id: 1, opened_at: openedAt.toISOString() }];
    
    const { result } = renderHook(() => usePositionAges(positions));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual(expect.objectContaining({ id: 1, age: 60 }));
  });

  it('should update the age dynamically over time', () => {
    const baseTime = new Date('2023-01-01T12:00:00.000Z').getTime();
    jest.setSystemTime(baseTime);

    const openedAt = new Date(baseTime - 60 * 1000); // Opened 1 minute ago
    const positions = [{ id: 1, opened_at: openedAt.toISOString() }];

    const { result } = renderHook(() => usePositionAges(positions));
    expect(result.current[0].age).toBe(60);

    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current[0].age).toBe(65);
  });

  it('should return age as null if opened_at is missing', () => {
    const positions = [{ id: 1 }];
    const { result } = renderHook(() => usePositionAges(positions));
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({ id: 1, age: null });
  });

  it('should return age as null if opened_at is invalid', () => {
    // Mock console.warn to suppress expected warnings during this test
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const positions = [{ id: 1, opened_at: 'invalid-date-format' }];
    const { result } = renderHook(() => usePositionAges(positions));
    
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({ id: 1, opened_at: 'invalid-date-format', age: null });

    consoleWarnSpy.mockRestore(); // Restore original console.warn
  });
  
  it('should handle null or undefined entries in the positions array', () => {
    const baseTime = new Date('2023-01-01T12:00:00.000Z').getTime();
    jest.setSystemTime(baseTime);
    const openedAt = new Date(baseTime - 60 * 1000); 
    
    const positions = [
      { id: 1, opened_at: openedAt.toISOString() },
      null, 
      undefined,
      { id: 2, opened_at: new Date(baseTime - 120 * 1000).toISOString() },
    ];
    const { result } = renderHook(() => usePositionAges(positions));

    expect(result.current).toHaveLength(4);
    expect(result.current[0]).toEqual(expect.objectContaining({ id: 1, age: 60 }));
    expect(result.current[1]).toEqual({ age: null }); // Handles null entry
    expect(result.current[2]).toEqual({ age: null }); // Handles undefined entry
    expect(result.current[3]).toEqual(expect.objectContaining({ id: 2, age: 120 }));
  });
}); 