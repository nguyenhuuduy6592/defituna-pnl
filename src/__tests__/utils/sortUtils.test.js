import { SORT_FIELD_CONFIG, sortPositions } from '@/utils/sortUtils';
import { calculateStatus } from '@/utils/positionUtils';

// Mock positionUtils
jest.mock('@/utils/positionUtils', () => ({
  calculateStatus: jest.fn(position => position.status || 'active')
}));

describe('SORT_FIELD_CONFIG', () => {
  const mockPosition = {
    pnl: { usd: 100 },
    yield: { usd: 50 },
    status: 'active',
    pair: 'BTC/USDT',
    state: 'open',
    walletAddress: '0x123',
    age: 7,
    size: 1000
  };

  it('extracts pnl value correctly', () => {
    expect(SORT_FIELD_CONFIG.pnl(mockPosition)).toBe(100);
  });

  it('extracts yield value correctly', () => {
    expect(SORT_FIELD_CONFIG.yield(mockPosition)).toBe(50);
  });

  it('calculates status correctly', () => {
    expect(SORT_FIELD_CONFIG.status(mockPosition)).toBe('active');
    expect(calculateStatus).toHaveBeenCalledWith(mockPosition);
  });

  it('extracts pair value correctly', () => {
    expect(SORT_FIELD_CONFIG.pair(mockPosition)).toBe('BTC/USDT');
    expect(SORT_FIELD_CONFIG.pair({})).toBe('');
  });

  it('extracts state value correctly', () => {
    expect(SORT_FIELD_CONFIG.state(mockPosition)).toBe('open');
    expect(SORT_FIELD_CONFIG.state({})).toBe('');
  });

  it('extracts walletAddress value correctly', () => {
    expect(SORT_FIELD_CONFIG.walletAddress(mockPosition)).toBe('0x123');
    expect(SORT_FIELD_CONFIG.walletAddress({})).toBe('');
  });

  it('extracts age value correctly', () => {
    expect(SORT_FIELD_CONFIG.age(mockPosition)).toBe(7);
  });

  it('extracts size value correctly', () => {
    expect(SORT_FIELD_CONFIG.size(mockPosition)).toBe(1000);
    expect(SORT_FIELD_CONFIG.size({})).toBe(0);
  });

  it('handles null yield values correctly', () => {
    expect(SORT_FIELD_CONFIG.yield(null)).toBe(0);
    expect(SORT_FIELD_CONFIG.yield({})).toBe(0);
    expect(SORT_FIELD_CONFIG.yield({ yield: null })).toBe(0);
    expect(SORT_FIELD_CONFIG.yield({ yield: {} })).toBe(0);
  });
});

describe('sortPositions', () => {
  const mockPositions = [
    {
      pnl: { usd: 100 },
      yield: { usd: 50 },
      status: 'active',
      pair: 'BTC/USDT',
      state: 'open',
      walletAddress: '0x123',
      age: 7,
      size: 1000
    },
    {
      pnl: { usd: 200 },
      yield: { usd: 25 },
      status: 'closed',
      pair: 'ETH/USDT',
      state: 'closed',
      walletAddress: '0x456',
      age: 3,
      size: 2000
    },
    {
      pnl: { usd: 150 },
      yield: { usd: 75 },
      status: 'liquidated',
      pair: 'SOL/USDT',
      state: 'liquidated',
      walletAddress: '0x789',
      age: null,
      size: 1500
    }
  ];

  it('handles empty or single-item arrays', () => {
    expect(sortPositions(null, 'pnl', 'asc')).toBeNull();
    expect(sortPositions([], 'pnl', 'asc')).toEqual([]);
    expect(sortPositions([mockPositions[0]], 'pnl', 'asc')).toEqual([mockPositions[0]]);
  });

  it('sorts by pnl correctly', () => {
    const ascResult = sortPositions(mockPositions, 'pnl', 'asc');
    expect(ascResult.map(p => p.pnl.usd)).toEqual([100, 150, 200]);

    const descResult = sortPositions(mockPositions, 'pnl', 'desc');
    expect(descResult.map(p => p.pnl.usd)).toEqual([200, 150, 100]);
  });

  it('sorts by yield correctly', () => {
    const ascResult = sortPositions(mockPositions, 'yield', 'asc');
    expect(ascResult.map(p => p.yield.usd)).toEqual([25, 50, 75]);

    const descResult = sortPositions(mockPositions, 'yield', 'desc');
    expect(descResult.map(p => p.yield.usd)).toEqual([75, 50, 25]);
  });

  it('sorts by status correctly', () => {
    const ascResult = sortPositions(mockPositions, 'status', 'asc');
    expect(ascResult.map(p => p.status)).toEqual(['active', 'closed', 'liquidated']);

    const descResult = sortPositions(mockPositions, 'status', 'desc');
    expect(descResult.map(p => p.status)).toEqual(['liquidated', 'closed', 'active']);
  });

  it('sorts by pair correctly', () => {
    const ascResult = sortPositions(mockPositions, 'pair', 'asc');
    expect(ascResult.map(p => p.pair)).toEqual(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);

    const descResult = sortPositions(mockPositions, 'pair', 'desc');
    expect(descResult.map(p => p.pair)).toEqual(['SOL/USDT', 'ETH/USDT', 'BTC/USDT']);
  });

  it('sorts by state correctly', () => {
    const ascResult = sortPositions(mockPositions, 'state', 'asc');
    expect(ascResult.map(p => p.state)).toEqual(['closed', 'liquidated', 'open']);

    const descResult = sortPositions(mockPositions, 'state', 'desc');
    expect(descResult.map(p => p.state)).toEqual(['open', 'liquidated', 'closed']);
  });

  it('sorts by walletAddress correctly', () => {
    const ascResult = sortPositions(mockPositions, 'walletAddress', 'asc');
    expect(ascResult.map(p => p.walletAddress)).toEqual(['0x123', '0x456', '0x789']);

    const descResult = sortPositions(mockPositions, 'walletAddress', 'desc');
    expect(descResult.map(p => p.walletAddress)).toEqual(['0x789', '0x456', '0x123']);
  });

  it('sorts by age correctly', () => {
    const ascResult = sortPositions(mockPositions, 'age', 'asc');
    expect(ascResult.map(p => p.age)).toEqual([3, 7, null]);

    const descResult = sortPositions(mockPositions, 'age', 'desc');
    expect(descResult.map(p => p.age)).toEqual([7, 3, null]);
  });

  it('sorts by size correctly', () => {
    const ascResult = sortPositions(mockPositions, 'size', 'asc');
    expect(ascResult.map(p => p.size)).toEqual([1000, 1500, 2000]);

    const descResult = sortPositions(mockPositions, 'size', 'desc');
    expect(descResult.map(p => p.size)).toEqual([2000, 1500, 1000]);
  });

  it('handles invalid sort fields gracefully', () => {
    const result = sortPositions(mockPositions, 'invalidField', 'asc');
    expect(result).toBeDefined();
    expect(result.length).toBe(mockPositions.length);
  });

  it('handles missing values gracefully', () => {
    const positionsWithMissing = [
      { pnl: { usd: 100 } },
      { pnl: { usd: undefined } },
      { pnl: null },
      {}
    ];

    const result = sortPositions(positionsWithMissing, 'pnl', 'asc');
    expect(result).toBeDefined();
    expect(result.length).toBe(positionsWithMissing.length);
  });

  it('handles age sorting with null values in both ascending and descending order', () => {
    const positionsWithNullAge = [
      { age: 1 },
      { age: null },
      { age: 2 }
    ];

    const ascResult = sortPositions(positionsWithNullAge, 'age', 'asc');
    expect(ascResult.map(p => p.age)).toEqual([1, 2, null]);

    const descResult = sortPositions(positionsWithNullAge, 'age', 'desc');
    expect(descResult.map(p => p.age)).toEqual([2, 1, null]);
  });
}); 