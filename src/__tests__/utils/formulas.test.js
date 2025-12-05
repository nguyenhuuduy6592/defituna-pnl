import {
  processTunaPosition,
  calculateLeverage,
  computeLiquidationPrices,
  createEmptyPositionTemplate,
} from '../../utils/formulas';

// Import non-exported functions for testing
const formulas = require('../../utils/formulas');

describe('formula', () => {
  describe('calculateLeverage', () => {
    it('handles normal case correctly', () => {
      const result = calculateLeverage({
        price: 2000,
        debtA: 1,
        debtB: 1000,
        totalA: 2,
        totalB: 2000,
      });
      expect(result).toBeCloseTo(2.0, 2);
    });

    it('returns default leverage for invalid price', () => {
      expect(
        calculateLeverage({
          price: 0,
          debtA: 1,
          debtB: 1000,
          totalA: 2,
          totalB: 2000,
        })
      ).toBe(1.0);
      expect(
        calculateLeverage({
          price: -1,
          debtA: 1,
          debtB: 1000,
          totalA: 2,
          totalB: 2000,
        })
      ).toBe(1.0);
      expect(
        calculateLeverage({
          price: NaN,
          debtA: 1,
          debtB: 1000,
          totalA: 2,
          totalB: 2000,
        })
      ).toBe(1.0);
    });

    it('handles zero or negative total value', () => {
      expect(
        calculateLeverage({
          price: 2000,
          debtA: 0,
          debtB: 0,
          totalA: 0,
          totalB: 0,
        })
      ).toBe(1.0);
    });

    it('caps leverage at 100x', () => {
      const result = calculateLeverage({
        price: 2000,
        debtA: 2,
        debtB: 4000,
        totalA: 2,
        totalB: 4000,
      });
      expect(result).toBe(100.0);
    });

    it('handles string inputs by converting to numbers', () => {
      const result = calculateLeverage({
        price: '2000',
        debtA: '1',
        debtB: '1000',
        totalA: '2',
        totalB: '2000',
      });
      expect(result).toBeCloseTo(2.0, 2);
    });
  });

  describe('computeLiquidationPrices', () => {
    it('computes liquidation prices correctly', () => {
      const result = computeLiquidationPrices({
        lowerPrice: 1000,
        upperPrice: 3000,
        debtA: 1,
        debtB: 1000,
        liquidity: 1000000,
        liquidationThreshold: 0.05,
      });

      expect(result.lowerLiquidationPrice).toBeGreaterThan(0);
      expect(result.upperLiquidationPrice).toBeGreaterThan(
        result.lowerLiquidationPrice
      );
    });

    it('returns zeros for invalid price range', () => {
      const result = computeLiquidationPrices({
        lowerPrice: 3000,
        upperPrice: 1000,
        debtA: 1,
        debtB: 1000,
        liquidity: 1000000,
        liquidationThreshold: 0.05,
      });

      expect(result).toEqual({
        lowerLiquidationPrice: 0,
        upperLiquidationPrice: 0,
      });
    });

    it('returns zeros for invalid liquidity', () => {
      const result = computeLiquidationPrices({
        lowerPrice: 1000,
        upperPrice: 3000,
        debtA: 1,
        debtB: 1000,
        liquidity: 0,
        liquidationThreshold: 0.05,
      });

      expect(result).toEqual({
        lowerLiquidationPrice: 0,
        upperLiquidationPrice: 0,
      });
    });

    it('uses default liquidation threshold if not provided', () => {
      const result = computeLiquidationPrices({
        lowerPrice: 1000,
        upperPrice: 3000,
        debtA: 1,
        debtB: 1000,
        liquidity: 1000000,
      });

      expect(result.lowerLiquidationPrice).toBeGreaterThan(0);
      expect(result.upperLiquidationPrice).toBeGreaterThan(
        result.lowerLiquidationPrice
      );
    });
  });

  describe('createEmptyPositionTemplate', () => {
    it('creates a template with default values', () => {
      const template = createEmptyPositionTemplate();

      expect(template).toEqual({
        leverage: 1,
        size: 0,
        collateral: { tokenA: 0, tokenB: 0, usd: 0 },
        debt: { tokenA: 0, tokenB: 0, usd: 0 },
        interest: { tokenA: 0, tokenB: 0, usd: 0 },
        liquidationPrice: { lower: 0, upper: 0 },
        entryPrice: 0,
        currentPrice: 0,
        limitOrderPrices: { lower: 0, upper: 0 },
        yield: { tokenA: 0, tokenB: 0, usd: 0 },
        compounded: { tokenA: 0, tokenB: 0, usd: 0 },
        rangePrices: { lower: 0, upper: 0 },
        pnl: { usd: 0, bps: 0 },
      });
    });

    it('creates a new object instance each time', () => {
      const template1 = createEmptyPositionTemplate();
      const template2 = createEmptyPositionTemplate();
      expect(template1).not.toBe(template2);
    });
  });

  describe('processTunaPosition', () => {
    it('returns empty template for missing position data', () => {
      const result = processTunaPosition(
        null,
        { data: {} },
        { data: [] },
        { decimals: 18 },
        { decimals: 18 }
      );
      expect(result).toEqual(createEmptyPositionTemplate());
    });

    it('returns empty template for missing pool data', () => {
      const result = processTunaPosition(
        { data: {} },
        null,
        { data: [] },
        { decimals: 18 },
        { decimals: 18 }
      );
      expect(result).toEqual(createEmptyPositionTemplate());
    });

    it('returns empty template for missing token data', () => {
      const result = processTunaPosition(
        { data: {} },
        { data: {} },
        { data: [] },
        null,
        { decimals: 18 }
      );
      expect(result).toEqual(createEmptyPositionTemplate());
    });

    it('returns empty template when no matching market found', () => {
      const result = processTunaPosition(
        { data: {} },
        { data: { address: 'pool1' } },
        { data: [{ pool_address: 'pool2' }] },
        { decimals: 18 },
        { decimals: 18 }
      );
      expect(result).toEqual(createEmptyPositionTemplate());
    });

    it('handles token decimal conversions correctly', () => {
      const mockPositionData = {
        data: {
          total_a: { amount: '1000000000000000000', usd: '1000' }, // 1 token
          total_b: { amount: '1000000', usd: '1000' }, // 1 token
          current_loan_a: { amount: '500000000000000000', usd: '500' }, // 0.5 token
          current_loan_b: { amount: '500000', usd: '500' }, // 0.5 token
          loan_funds_a: { amount: '400000000000000000', usd: '400' }, // 0.4 token
          loan_funds_b: { amount: '400000', usd: '400' }, // 0.4 token
          yield_a: { amount: '100000000000000000', usd: '100' }, // 0.1 token
          yield_b: { amount: '100000', usd: '100' }, // 0.1 token
          compounded_yield_a: { amount: '50000000000000000', usd: '50' }, // 0.05 token
          compounded_yield_b: { amount: '50000', usd: '50' }, // 0.05 token
          deposited_collateral_usd: { amount: '1000' },
          pnl_usd: { amount: '100', bps: '1000' },
          tick_current_index: 0,
          tick_entry_index: 0,
          entry_sqrt_price: '18446744073709551616',
          tick_lower_index: -1000,
          tick_upper_index: 1000,
          tick_stop_loss_index: -2000,
          tick_take_profit_index: 2000,
          liquidity: '1000000',
        },
      };

      const mockPoolData = {
        data: {
          address: 'pool1',
          tick_current_index: 0,
        },
      };

      const mockMarketData = {
        data: [
          {
            pool_address: 'pool1',
            liquidation_threshold: 50000, // 5%
          },
        ],
      };

      const mockTokenAData = { decimals: 18 }; // Token A (18 decimals)
      const mockTokenBData = { decimals: 6 }; // Token B (6 decimals)

      const result = processTunaPosition(
        mockPositionData,
        mockPoolData,
        mockMarketData,
        mockTokenAData,
        mockTokenBData
      );

      // Check amount conversions
      expect(result.collateral.tokenA).toBe(0.5); // 1 - 0.5 (total - debt)
      expect(result.collateral.tokenB).toBe(0.5);
      expect(result.debt.tokenA).toBe(0.5);
      expect(result.debt.tokenB).toBe(0.5);
      expect(result.interest.tokenA).toBeCloseTo(0.1, 10); // 0.5 - 0.4 (debt - loan funds)
      expect(result.interest.tokenB).toBeCloseTo(0.1, 10);
      expect(result.yield.a.amount).toBeCloseTo(0.1, 10);
      expect(result.yield.b.amount).toBeCloseTo(0.1, 10);
      expect(result.compounded.a.amount).toBeCloseTo(0.05, 10);
      expect(result.compounded.b.amount).toBeCloseTo(0.05, 10);

      // Check USD values
      expect(result.size).toBe(2000); // total_a.usd + total_b.usd
      expect(result.collateral.usd).toBe('1000');
      expect(result.debt.usd).toBe(1000); // loan_a.usd + loan_b.usd
      expect(result.interest.usd).toBe(200); // (current_loan - loan_funds) for both tokens
      expect(result.yield.usd).toBe(200); // yield_a.usd + yield_b.usd
      expect(result.compounded.usd).toBe(100); // compounded_a.usd + compounded_b.usd
      expect(result.pnl.usd).toBe(100);
      expect(result.pnl.bps).toBe(1000);

      // Check price calculations (prices are in raw form with decimals)
      const decimalsAdjustment =
        10 ** (mockTokenAData.decimals - mockTokenBData.decimals);
      expect(result.currentPrice).toBe(decimalsAdjustment);
      expect(result.entryPrice).toBe(decimalsAdjustment);
      expect(result.rangePrices.lower).toBeLessThan(decimalsAdjustment);
      expect(result.rangePrices.upper).toBeGreaterThan(decimalsAdjustment);
      expect(result.limitOrderPrices.lower).toBeLessThan(
        result.rangePrices.lower
      );
      expect(result.limitOrderPrices.upper).toBeGreaterThan(
        result.rangePrices.upper
      );
    });

    it('handles missing optional values', () => {
      const result = processTunaPosition(
        {
          data: {
            total_a: { amount: '1000000000000000000' },
            total_b: { amount: '1000000' },
            tick_current_index: 0,
            tick_lower_index: -1000,
            tick_upper_index: 1000,
            liquidity: '1000000',
          },
        },
        {
          data: {
            address: 'pool1',
            tick_current_index: 0,
          },
        },
        {
          data: [
            {
              pool_address: 'pool1',
              liquidation_threshold: 50000,
            },
          ],
        },
        { decimals: 18 },
        { decimals: 6 }
      );

      // Check default values for missing fields
      expect(result.debt.tokenA).toBe(0);
      expect(result.debt.tokenB).toBe(0);
      expect(result.interest.tokenA).toBe(0);
      expect(result.interest.tokenB).toBe(0);
      expect(result.yield.a.amount).toBe(0);
      expect(result.yield.b.amount).toBe(0);
      expect(result.compounded.a.amount).toBe(0);
      expect(result.compounded.b.amount).toBe(0);
      expect(result.pnl.usd).toBe(0);
      expect(result.pnl.bps).toBe(0);
    });

    it('handles missing token decimals', () => {
      const result = processTunaPosition(
        {
          data: {
            total_a: { amount: '1000000000000000000' },
            total_b: { amount: '1000000' },
            tick_current_index: 0,
          },
        },
        {
          data: {
            address: 'pool1',
            tick_current_index: 0,
          },
        },
        {
          data: [
            {
              pool_address: 'pool1',
            },
          ],
        },
        {}, // No decimals specified
        {} // No decimals specified
      );

      // Should use 0 as default for decimals
      expect(result.collateral.tokenA).toBe(1000000000000000000);
      expect(result.collateral.tokenB).toBe(1000000);
    });

    it('handles error in price calculations', () => {
      const mockPositionData = {
        data: {
          token_a: 1000,
          token_b: 2000,
          liquidity: 5000,
          tick_current_index: Number.MAX_SAFE_INTEGER + 1, // This will cause an error in calculations
        },
      };

      const mockPoolData = {
        data: {
          address: 'pool1',
          token0: 'tokenA',
          token1: 'tokenB',
          tick_current_index: Number.MAX_SAFE_INTEGER + 1, // This will cause an error in calculations
        },
      };

      const mockTokenAData = { decimals: 6 };
      const mockTokenBData = { decimals: 6 };
      const mockMarketData = {
        data: [{ pool_address: 'pool1' }],
      };

      const result = formulas.processTunaPosition(
        mockPositionData,
        mockPoolData,
        mockTokenAData,
        mockTokenBData,
        mockMarketData
      );

      // Verify that an empty template is returned
      expect(result).toEqual(formulas.createEmptyPositionTemplate());
    });
  });
});
