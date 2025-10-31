import { sqrtPriceToPrice, tickIndexToPrice} from "@orca-so/whirlpools-core";

/**
 * Financial calculation utilities for DeFiTuna positions.
 * This module provides functions to calculate leverage, liquidation prices,
 * and process position data for display and analysis.
 */

/**
 * Calculates the leverage of a position based on debt and total values
 * @param {Object} params - Position parameters
 * @param {number} params.price - Current price of token A in terms of token B
 * @param {number} params.debtA - Debt amount of token A
 * @param {number} params.debtB - Debt amount of token B
 * @param {number} params.totalA - Total amount of token A
 * @param {number} params.totalB - Total amount of token B
 * @returns {number} The calculated leverage value, capped at 100 for display
 */
export function calculateLeverage({ price, debtA, debtB, totalA, totalB }) {
    try {
        if (!price || price <= 0 || isNaN(price)) {
            console.warn('[calculateLeverage] Invalid price:', price);
            return 1.0; // Default leverage
        }

        // Ensure all values are numbers
        const numTotalA = Number(totalA) || 0;
        const numTotalB = Number(totalB) || 0;
        const numDebtA = Number(debtA) || 0;
        const numDebtB = Number(debtB) || 0;
        const numPrice = Number(price);

        const totalValue = numTotalA * numPrice + numTotalB;
        if (totalValue <= 0) {
            console.warn('[calculateLeverage] Total value is zero or negative:', totalValue);
            return 1.0; // Default leverage
        }

        const debtValue = numDebtA * numPrice + numDebtB;
        
        // Prevent division by zero or negative values
        if (totalValue <= debtValue) {
            console.warn('[calculateLeverage] Total value less than or equal to debt value');
            return 100.0; // Cap at max leverage for display
        }

        const leverage = totalValue / (totalValue - debtValue);
        
        // Cap at 100x for display purposes
        return Math.min(leverage, 100.0);
    } catch (error) {
        console.error('[calculateLeverage] Error:', error.message);
        return 1.0; // Default leverage on error
    }
}

/**
 * Computes the liquidation prices for a position using the quadratic formula
 * @param {Object} params - Position parameters for liquidation calculation
 * @param {number} params.lowerPrice - Lower bound of the price range
 * @param {number} params.upperPrice - Upper bound of the price range
 * @param {number} params.debtA - Debt amount of token A
 * @param {number} params.debtB - Debt amount of token B
 * @param {BigInt|string|number} params.liquidity - Position liquidity
 * @param {number} params.liquidationThreshold - Liquidation threshold (e.g., 0.05 for 5%)
 * @returns {Object} Object containing lower and upper liquidation prices
 */
export function computeLiquidationPrices({ lowerPrice, upperPrice, debtA, debtB, liquidity, liquidationThreshold }) {
    try {
        // Input validation
        if (!lowerPrice || !upperPrice || lowerPrice >= upperPrice) {
            console.warn('[computeLiquidationPrices] Invalid price range:', { lowerPrice, upperPrice });
            return { lowerLiquidationPrice: 0, upperLiquidationPrice: 0 };
        }

        if (!liquidity || Number(liquidity) <= 0) {
            console.warn('[computeLiquidationPrices] Invalid liquidity:', liquidity);
            return { lowerLiquidationPrice: 0, upperLiquidationPrice: 0 };
        }

        // Ensure values are numbers
        const numLowerPrice = Number(lowerPrice);
        const numUpperPrice = Number(upperPrice);
        const numDebtA = Number(debtA) || 0;
        const numDebtB = Number(debtB) || 0;
        const numLiquidity = Number(liquidity);
        const numLiquidationThreshold = Number(liquidationThreshold) || 0.05; // Default 5%

        const lowerSqrtPrice = Math.sqrt(numLowerPrice);
        const upperSqrtPrice = Math.sqrt(numUpperPrice);
        
        const a = numDebtA + numLiquidationThreshold * (numLiquidity / upperSqrtPrice);
        const b = -2 * numLiquidationThreshold * numLiquidity;
        const c = numDebtB + numLiquidationThreshold * (numLiquidity * lowerSqrtPrice);
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0 || a === 0) {
            console.warn('[computeLiquidationPrices] No real solution exists or division by zero.');
            return { lowerLiquidationPrice: 0, upperLiquidationPrice: 0 };
        }
        
        const lower = (-b - Math.sqrt(discriminant)) / (2 * a);
        const upper = (-b + Math.sqrt(discriminant)) / (2 * a);
        
        return {
            lowerLiquidationPrice: lower > 0 ? lower * lower : 0,
            upperLiquidationPrice: upper > 0 ? upper * upper : 0
        };
    } catch (error) {
        console.error('[computeLiquidationPrices] Error:', error.message);
        return { lowerLiquidationPrice: 0, upperLiquidationPrice: 0 };
    }
}

/**
 * Creates an empty position template with default values
 * @returns {Object} Empty position template
 */
export function createEmptyPositionTemplate() {
    return {
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
        pnl: { usd: 0, bps: 0 }
    };
}

/**
 * Main function to process a Tuna position and calculate derived values
 * @param {Object} positionData - The position data object
 * @param {Object} poolData - The pool data object
 * @param {Object} marketData - The market data object
 * @param {Object} tokenAData - Token A metadata
 * @param {Object} tokenBData - Token B metadata
 * @returns {Object} Processed position with calculated values
 */
export function processTunaPosition(positionData, poolData, marketData, tokenAData, tokenBData) {
    try {
        // Validate inputs
        if (!positionData?.data || !poolData?.data) {
            console.error('[processTunaPosition] Missing position or pool data', { 
                hasPosition: !!positionData?.data, 
                hasPool: !!poolData?.data 
            });
            return createEmptyPositionTemplate();
        }

        if (!tokenAData || !tokenBData) {
            console.error('[processTunaPosition] Missing token data', { 
                hasTokenA: !!tokenAData, 
                hasTokenB: !!tokenBData 
            });
            return createEmptyPositionTemplate();
        }

        const position = positionData.data;
        const pool = poolData.data;
        
        // Find matching market data
        const market = marketData?.data?.find(m => m.pool_address === pool.address);
        if (!market) {
            console.error('[processTunaPosition] No matching market found for pool', pool.address);
            return createEmptyPositionTemplate();
        }

        const tokenA = tokenAData;
        const tokenB = tokenBData;

        const tokenADecimals = tokenA.decimals || 0;
        const tokenBDecimals = tokenB.decimals || 0;

        // Convert string amounts to numbers with proper decimal handling
        const totalA = Number(position.total_a?.amount || 0) / 10 ** tokenADecimals;
        const totalB = Number(position.total_b?.amount || 0) / 10 ** tokenBDecimals;
        const debtA = Number(position.current_loan_a?.amount || 0) / 10 ** tokenADecimals;
        const debtB = Number(position.current_loan_b?.amount || 0) / 10 ** tokenBDecimals;
        const loanFundsA = Number(position.loan_funds_a?.amount || 0) / 10 ** tokenADecimals;
        const loanFundsB = Number(position.loan_funds_b?.amount || 0) / 10 ** tokenBDecimals;
        const yieldA = Number(position.yield_a?.amount || 0) / 10 ** tokenADecimals;
        const yieldB = Number(position.yield_b?.amount || 0) / 10 ** tokenBDecimals;
        const compoundedA = Number(position.compounded_yield_a?.amount || 0) / 10 ** tokenADecimals;
        const compoundedB = Number(position.compounded_yield_b?.amount || 0) / 10 ** tokenBDecimals;
        const pnlA = Number(position.pnl_a?.amount || 0) / 10 ** tokenADecimals;
        const pnlB = Number(position.pnl_b?.amount || 0) / 10 ** tokenBDecimals;

        // Calculate prices and ticks
        const currentPrice = tickIndexToPrice(pool.tick_current_index, tokenADecimals, tokenBDecimals);
        const lowerRangePrice = tickIndexToPrice(position.tick_lower_index, tokenADecimals, tokenBDecimals);
        const upperRangePrice = tickIndexToPrice(position.tick_upper_index, tokenADecimals, tokenBDecimals);
        const lowerLimitOrderPrice = position.tick_stop_loss_index == -2147483648 ? 0 : tickIndexToPrice(position.tick_stop_loss_index, tokenADecimals, tokenBDecimals);
        const upperLimitOrderPrice = position.tick_take_profit_index == 2147483647 ? 0 :tickIndexToPrice(position.tick_take_profit_index, tokenADecimals, tokenBDecimals);

        // Calculate leverage
        const leverage = calculateLeverage({ price: currentPrice, debtA, debtB, totalA, totalB });

        // Calculate size and collateral
        const size = Number(position.total_a?.usd || 0) + Number(position.total_b?.usd || 0) +
            Number(position.leftovers_a?.usd || 0) + Number(position.leftovers_b?.usd || 0);
        const collateral = {
            tokenA: totalA - debtA,
            tokenB: totalB - debtB,
            usd: position.deposited_collateral_usd?.amount
        };

        // Calculate debt and interest
        const debt = {
            tokenA: debtA,
            tokenB: debtB,
            usd: Number(position.current_loan_a?.usd || 0) + Number(position.current_loan_b?.usd || 0)
        };

        const interest = {
            tokenA: debtA - loanFundsA,
            tokenB: debtB - loanFundsB,
            usd: Number(position.current_loan_a?.usd || 0) - Number(position.loan_funds_a?.usd || 0) + 
                 Number(position.current_loan_b?.usd || 0) - Number(position.loan_funds_b?.usd || 0)
        };

        // Calculate liquidation prices
        let liquidationPrices;
        if (leverage == 1) {
            liquidationPrices = { lowerLiquidationPrice: 0, upperLiquidationPrice: 0 };
        }
        else {
            const liquidationThreshold = (market.liquidation_threshold || 0) / 1000000; // Convert from parts per million
            liquidationPrices = computeLiquidationPrices({
                lowerPrice: lowerRangePrice,
                upperPrice: upperRangePrice,
                debtA,
                debtB,
                liquidity: BigInt(position.liquidity || 0),
                liquidationThreshold
            });
        }

        // Calculate entry and limit order prices
        const entryPrice = position.entry_sqrt_price ? sqrtPriceToPrice(BigInt(position.entry_sqrt_price), tokenADecimals, tokenBDecimals) : 0;

        // Calculate yield values
        const yieldValue = {
            usd: Number(position.yield_a?.usd || 0) + Number(position.yield_b?.usd || 0),
            a: {
                amount: yieldA,
            },
            b: {
                amount: yieldB,
            }
        };

        const compounded = {
            usd: Number(position.compounded_yield_a?.usd || 0) + Number(position.compounded_yield_b?.usd || 0),
            a: {
                amount: compoundedA,
            },
            b: {
                amount: compoundedB,
            }
        };

        // Calculate PnL
        const pnl = {
            usd: Number(position.pnl_usd?.amount || 0),
            bps: Number(position.pnl_usd?.bps || 0),
            a: {
                amount: pnlA,
                bps: Number(position.pnl_a?.bps || 0)
            },
            b: {
                amount: pnlB,
                bps: Number(position.pnl_b?.bps || 0)
            }
        };

        return {
            leverage,
            size,
            collateral,
            debt,
            interest,
            liquidationPrice: {
                lower: liquidationPrices.lowerLiquidationPrice,
                upper: liquidationPrices.upperLiquidationPrice
            },
            entryPrice,
            currentPrice,
            limitOrderPrices: {
                lower: isNaN(lowerLimitOrderPrice) ? Infinity : lowerLimitOrderPrice,
                upper: isNaN(upperLimitOrderPrice) ? Infinity : upperLimitOrderPrice,
            },
            yield: yieldValue,
            compounded,
            rangePrices: {
                lower: lowerRangePrice,
                upper: upperRangePrice
            },
            pnl,
        };
    } catch (error) {
        console.error('[processTunaPosition] Error processing position:', error.message);
        return createEmptyPositionTemplate();
    }
}
