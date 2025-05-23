import {
  decodeValue,
  getValueClass,
  getStateClass,
  calculateStatus,
  addWalletAddressToPositions,
  decodePosition,
  decodePositions
} from '../../utils/positionUtils';

describe('decodeValue', () => {
  it('handles null and undefined inputs', () => {
    expect(decodeValue(null, 100)).toBeNull();
    expect(decodeValue(undefined, 100)).toBeNull();
  });

  it('decodes values correctly', () => {
    expect(decodeValue(1234, 100)).toBe(12.34);
    expect(decodeValue(1000000, 1000000)).toBe(1);
    expect(decodeValue(0, 100)).toBe(0);
  });
});

describe('getValueClass', () => {
  it('handles null and undefined inputs', () => {
    expect(getValueClass(null)).toBe('zero');
    expect(getValueClass(undefined)).toBe('zero');
  });

  it('returns correct classes for different values', () => {
    expect(getValueClass(100)).toBe('positive');
    expect(getValueClass(-100)).toBe('negative');
    expect(getValueClass(0)).toBe('zero');
  });
});

describe('getStateClass', () => {
  it('returns correct classes for different states', () => {
    expect(getStateClass('In range')).toBe('stateInRange');
    expect(getStateClass('Out of range')).toBe('stateWarning');
    expect(getStateClass('Closed')).toBe('stateClosed');
    expect(getStateClass('Limit Closed')).toBe('stateClosed');
    expect(getStateClass('Liquidated')).toBe('stateLiquidated');
    expect(getStateClass('Open (Unknown Range)')).toBe('stateOpenUnknown');
    expect(getStateClass('Unknown State')).toBe('');
  });
});

describe('calculateStatus', () => {
  it('handles null and undefined inputs', () => {
    expect(calculateStatus(null)).toBe('Unknown');
    expect(calculateStatus({})).toBe('Unknown');
    expect(calculateStatus({ state: null })).toBe('Unknown');
  });

  it('handles non-open states', () => {
    expect(calculateStatus({ state: 'closed' })).toBe('Closed');
    expect(calculateStatus({ state: 'liquidated' })).toBe('Liquidated');
    expect(calculateStatus({ state: 'closed_by_limit_order' })).toBe('Limit Closed');
    expect(calculateStatus({ state: 'custom' })).toBe('Custom');
  });

  it('handles open state with missing price data', () => {
    expect(calculateStatus({ state: 'open' })).toBe('Open (Unknown Range)');
    expect(calculateStatus({ 
      state: 'open',
      currentPrice: 100,
      rangePrices: { lower: null, upper: 200 }
    })).toBe('Open (Unknown Range)');
  });

  it('determines in-range status correctly', () => {
    const position = {
      state: 'open',
      currentPrice: 150,
      rangePrices: { lower: 100, upper: 200 }
    };
    expect(calculateStatus(position)).toBe('In range');

    position.currentPrice = 50;
    expect(calculateStatus(position)).toBe('Out of range');

    position.currentPrice = 250;
    expect(calculateStatus(position)).toBe('Out of range');
  });
});

describe('addWalletAddressToPositions', () => {
  it('handles invalid inputs', () => {
    expect(addWalletAddressToPositions(null, '0x123')).toEqual([]);
    expect(addWalletAddressToPositions(undefined, '0x123')).toEqual([]);
    expect(addWalletAddressToPositions('not-an-array', '0x123')).toEqual([]);
  });

  it('adds wallet address to positions', () => {
    const positions = [
      { id: 1, data: 'test1' },
      { id: 2, data: 'test2' }
    ];
    const walletAddress = '0x123';
    const result = addWalletAddressToPositions(positions, walletAddress);

    expect(result).toHaveLength(2);
    result.forEach(position => {
      expect(position.walletAddress).toBe(walletAddress);
    });
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });
});

describe('decodePosition', () => {
  it('handles null input', () => {
    expect(decodePosition(null)).toBeNull();
  });

  it('decodes a position correctly', () => {
    const position = {
      p_addr: '0x123',
      state: 'open',
      pair: 'ETH/USD',
      c_price: 1000000, // $1.00
      e_price: 2000000, // $2.00
      lev: 200, // 2x
      sz: 10000, // $100.00
      r_prices: { l: 900000, u: 1100000 },
      liq_price: { l: 800000, u: 1200000 },
      lim_prices: { l: 700000, u: 1300000 },
      pnl: { u: 5000, b: 1000 },
      yld: { u: 1000 },
      cmp: { u: 2000 },
      col: { u: 20000 },
      dbt: { u: 10000 },
      int: { u: 500 },
      opened_at: '2023-01-01'
    };

    const decoded = decodePosition(position);

    expect(decoded).toMatchObject({
      positionAddress: '0x123',
      state: 'open',
      pair: 'ETH/USD',
      currentPrice: 1,
      entryPrice: 2,
      leverage: 2,
      size: 100,
      rangePrices: { lower: 0.9, upper: 1.1 },
      liquidationPrice: { lower: 0.8, upper: 1.2 },
      limitOrderPrices: { lower: 0.7, upper: 1.3 },
      pnl: { usd: 50, bps: 1000 },
      yield: { usd: 10 },
      compounded: { usd: 20 },
      collateral: { usd: 200 },
      debt: { usd: 100 },
      interest: { usd: 5 },
      opened_at: '2023-01-01',
      displayStatus: 'In range'
    });
  });

  it('handles missing nested objects', () => {
    const position = {
      p_addr: '0x123',
      state: 'open',
      pair: 'ETH/USD'
    };

    const decoded = decodePosition(position);

    expect(decoded.rangePrices).toEqual({ lower: null, upper: null });
    expect(decoded.liquidationPrice).toEqual({ lower: null, upper: null });
    expect(decoded.limitOrderPrices).toEqual({ lower: null, upper: null });
    expect(decoded.displayStatus).toBe('Open (Unknown Range)');
  });
});

describe('decodePositions', () => {
  it('handles invalid inputs', () => {
    expect(decodePositions(null)).toEqual([]);
    expect(decodePositions(undefined)).toEqual([]);
    expect(decodePositions('not-an-array')).toEqual([]);
  });

  it('decodes multiple positions', () => {
    const positions = [
      {
        p_addr: '0x123',
        state: 'open',
        pair: 'ETH/USD',
        c_price: 1000000,
        pnl: { u: 5000, b: 1000 }
      },
      {
        p_addr: '0x456',
        state: 'closed',
        pair: 'BTC/USD',
        c_price: 2000000,
        pnl: { u: -3000, b: -500 }
      }
    ];

    const decoded = decodePositions(positions);

    expect(decoded).toHaveLength(2);
    expect(decoded[0].positionAddress).toBe('0x123');
    expect(decoded[0].currentPrice).toBe(1);
    expect(decoded[1].positionAddress).toBe('0x456');
    expect(decoded[1].currentPrice).toBe(2);
  });
}); 