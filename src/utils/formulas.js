// Helper functions
function calculateLeverage({ price, debtA, debtB, totalA, totalB }) {
    const totalValue = totalA * price + totalB;
    const debtValue = debtA * price + debtB;
    return totalValue / (totalValue - debtValue);
}

function computeLiquidationPrices({ lowerPrice, upperPrice, debtA, debtB, liquidity, liquidationThreshold }) {
    const lowerSqrtPrice = Math.sqrt(lowerPrice);
    const upperSqrtPrice = Math.sqrt(upperPrice);
    const a = debtA + liquidationThreshold * (Number(liquidity) / upperSqrtPrice);
    const b = -2 * liquidationThreshold * Number(liquidity);
    const c = debtB + liquidationThreshold * (Number(liquidity) * lowerSqrtPrice);
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return { lower: 0, upper: 0 };
    const lower = (-b - Math.sqrt(discriminant)) / (2 * a);
    const upper = (-b + Math.sqrt(discriminant)) / (2 * a);
    return {
        lowerLiquidationPrice: lower > 0 ? lower * lower : 0,
        upperLiquidationPrice: upper > 0 ? upper * upper : 0
    };
}

function tickToPrice(tick, decimalsA, decimalsB) {
    if (tick === 2147483647) {
        return Infinity;
    }

    const price = Math.pow(1.0001, tick);
    return price * (10 ** (decimalsA - decimalsB));
}

function checkInRange(currentTick, lowerTick, upperTick) {
    return currentTick >= lowerTick && currentTick <= upperTick;
}

// Main position processing function
export function processTunaPosition(positionData, poolData, marketData, tokenAData, tokenBData) {
    const position = positionData.data;
    const pool = poolData.data;
    const market = marketData.data.find(m => m.pool_address === pool.address);
    const tokenA = tokenAData;
    const tokenB = tokenBData;

    const tokenADecimals = tokenA.decimals;
    const tokenBDecimals = tokenB.decimals;

    // Convert string amounts to numbers with proper decimal handling
    const totalA = Number(position.total_a.amount) / 10 ** tokenADecimals;
    const totalB = Number(position.total_b.amount) / 10 ** tokenBDecimals;
    const debtA = Number(position.current_loan_a.amount) / 10 ** tokenADecimals;
    const debtB = Number(position.current_loan_b.amount) / 10 ** tokenBDecimals;
    const loanFundsA = Number(position.loan_funds_a.amount) / 10 ** tokenADecimals;
    const loanFundsB = Number(position.loan_funds_b.amount) / 10 ** tokenBDecimals;
    const yieldA = Number(position.yield_a.amount) / 10 ** tokenADecimals;
    const yieldB = Number(position.yield_b.amount) / 10 ** tokenBDecimals;
    const compoundedA = Number(position.compounded_yield_a.amount) / 10 ** tokenADecimals;
    const compoundedB = Number(position.compounded_yield_b.amount) / 10 ** tokenBDecimals;

    // Calculate prices and ticks
    const currentPrice = tickToPrice(pool.tick_current_index, tokenADecimals, tokenBDecimals);
    const lowerRangePrice = tickToPrice(position.tick_lower_index, tokenADecimals, tokenBDecimals);
    const upperRangePrice = tickToPrice(position.tick_upper_index, tokenADecimals, tokenBDecimals);
    const lowerLimitOrderPrice = tickToPrice(position.tick_stop_loss_index, tokenADecimals, tokenBDecimals);
    const upperLimitOrderPrice = tickToPrice(position.tick_take_profit_index, tokenADecimals, tokenBDecimals);

    // Calculate leverage
    const leverage = calculateLeverage({ price: currentPrice, debtA, debtB, totalA, totalB });

    // Calculate size and collateral
    const size = position.total_a.usd + position.total_b.usd;
    const collateral = {
        tokenA: totalA - debtA,
        tokenB: totalB - debtB,
        usd: position.total_a.usd - position.current_loan_a.usd + position.total_b.usd - position.current_loan_b.usd
    };

    // Calculate debt and interest
    const debt = {
        tokenA: debtA,
        tokenB: debtB,
        usd: position.current_loan_a.usd + position.current_loan_b.usd
    };

    const interest = {
        tokenA: debtA - loanFundsA,
        tokenB: debtB - loanFundsB,
        usd: position.current_loan_a.usd - position.loan_funds_a.usd + position.current_loan_b.usd - position.loan_funds_b.usd
    };

    // Calculate liquidation prices
    const liquidationPrices = computeLiquidationPrices({
        lowerPrice: lowerRangePrice,
        upperPrice: upperRangePrice,
        debtA,
        debtB,
        liquidity: BigInt(position.liquidity),
        liquidationThreshold: market.liquidation_threshold / 1000000
    });

    // Calculate entry and limit order prices
    const entryPrice = tickToPrice(position.tick_entry_index, tokenADecimals, tokenBDecimals);

    // Calculate yield values
    const yieldValue = {
        tokenA: yieldA,
        tokenB: yieldB,
        usd: position.yield_a.usd + position.yield_b.usd
    };

    const compounded = {
        tokenA: compoundedA,
        tokenB: compoundedB,
        usd: position.compounded_yield_a.usd + position.compounded_yield_b.usd
    };

    // Calculate PnL
    const pnl = {
        usd: position.pnl_usd.amount,
        bps: position.pnl_usd.bps
    };

    return {
        leverage: leverage,
        size: size,
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
}
