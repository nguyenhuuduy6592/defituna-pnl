import {
  getValueClass,
  getStateClass,
  calculateStatus,
  addWalletAddressToPositions,
  decodePosition,
  decodePositions
} from '../../utils/positionUtils';

describe('positionUtils', () => {

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
        c_price: 1.00, // $1.00 (raw decimal)
        e_price: 2.00, // $2.00 (raw decimal)
        lev: 2, // 2x (raw decimal)
        sz: 100.00, // $100.00 (raw decimal)
        r_prices: { l: 0.9, u: 1.1 },
        liq_price: { l: 0.8, u: 1.2 },
        lim_prices: { l: 0.7, u: 1.3 },
        pnl: { u: 50, b: 1000 },
        yld: { u: 10 },
        cmp: { u: 20 },
        col: { u: 200 },
        dbt: { u: 100 },
        int: { u: 5 },
        opened_at: '2023-01-01'
      };

      const decoded = decodePosition(position);

      expect(decoded).toMatchObject({
        positionAddress: '0x123',
        state: 'open',
        pair: 'ETH/USD',
        currentPrice: 1.00,
        entryPrice: 2.00,
        leverage: 2,
        size: 100.00,
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

      expect(decoded.rangePrices).toEqual({ lower: undefined, upper: undefined });
      expect(decoded.liquidationPrice).toEqual({ lower: undefined, upper: undefined });
      expect(decoded.limitOrderPrices).toEqual({ lower: undefined, upper: undefined });
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
          c_price: 1.00,
          pnl: { u: 50, b: 1000 }
        },
        {
          p_addr: '0x456',
          state: 'closed',
          pair: 'BTC/USD',
          c_price: 2.00,
          pnl: { u: -30, b: -500 }
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
});