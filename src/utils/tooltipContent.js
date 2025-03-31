/**
 * Tooltip content for metrics and key concepts
 * This file provides detailed explanations for metrics shown in the application
 */

// Fee APR tooltip content based on values
export const getFeeAPRTooltip = (value) => {
  const aprValue = parseFloat(value);
  let riskLevel, recommendation, explanation;

  if (aprValue >= 50) {
    riskLevel = "High";
    recommendation = "Check volatility before providing liquidity";
    explanation = "May not be sustainable long-term";
  } else if (aprValue >= 20) {
    riskLevel = "Medium-High";
    recommendation = "Monitor volatility";
    explanation = "Strong fee generation";
  } else if (aprValue >= 10) {
    riskLevel = "Medium";
    recommendation = "Reasonable for the risk";
    explanation = "Balanced fee generation";
  } else {
    riskLevel = "Low";
    recommendation = "Consider other pools unless seeking stability";
    explanation = "More stable but lower returns";
  }

  return `Annual rate of return from trading fees if current activity continues.

Risk level: ${riskLevel}
${explanation}

• ${recommendation}
• Compare against other investments
• Separate from impermanent loss`;
};

// Volume/TVL tooltip content based on values
export const getVolumeTVLTooltip = (value) => {
  const ratio = parseFloat(value);
  let efficiency, liquidity;

  if (ratio >= 5) {
    efficiency = "Excellent";
    liquidity = "May need more liquidity";
  } else if (ratio >= 2) {
    efficiency = "Good";
    liquidity = "Well-utilized";
  } else if (ratio >= 1) {
    efficiency = "Average";
    liquidity = "Balanced";
  } else if (ratio >= 0.5) {
    efficiency = "Below average";
    liquidity = "Possibly over-supplied";
  } else {
    efficiency = "Poor";
    liquidity = "Significantly over-supplied";
  }

  return `How efficiently the pool uses liquidity to generate volume.

Capital Efficiency: ${efficiency}
${liquidity}

• Higher ratios = more trading per $ deposited
• Low ratios = reduced fee opportunities
• Helps identify underserved trading pairs`;
};

// Volatility tooltip content
export const getVolatilityTooltip = (value) => {
  let riskLevel, impermanentLoss, suitability;

  switch (value.toLowerCase()) {
    case 'high':
      riskLevel = "High price fluctuation";
      impermanentLoss = "Significant IL risk";
      suitability = "Better for short-term positions";
      break;
    case 'medium':
      riskLevel = "Moderate price fluctuation";
      impermanentLoss = "Moderate IL risk";
      suitability = "Balanced risk/reward";
      break;
    case 'low':
      riskLevel = "Low price fluctuation";
      impermanentLoss = "Minimal IL risk";
      suitability = "Good for passive liquidity";
      break;
    default:
      riskLevel = "Unknown volatility";
      impermanentLoss = "Unknown IL risk";
      suitability = "Exercise caution";
  }

  return `How much token prices fluctuate relative to each other.

• ${riskLevel}
• ${impermanentLoss}
• ${suitability}

Lower volatility = more stable returns
Higher volatility = potential for higher fees but greater IL`;
};

// TVL tooltip content
export const getTVLTooltip = (value) => {
  return `Total value of assets deposited in this pool.

For traders:
• Higher TVL = better price execution
• Lower slippage for trades

For LPs:
• Higher TVL = more competition for fees
• Lower TVL = higher fee share but higher risk`;
};

// Volume tooltip content
export const getVolumeTooltip = (timeframe) => {
  return `Total trading activity in this pool over ${timeframe}.

For traders:
• Higher volume = better liquidity & spreads

For LPs:
• Higher volume = more fees earned
• Volume trends help predict future fees`;
};

// Yield tooltip content
export const getYieldTooltip = (timeframe) => {
  return `Percentage return from fees over ${timeframe}.

• Direct indicator of recent returns
• Does NOT account for impermanent loss
• Compare to volatility for risk-adjusted assessment`;
};

// Fee Rate tooltip content
export const getFeeRateTooltip = () => {
  return `Percentage fee charged on every trade.

• Higher fees = Better for LPs (more per trade)
• Lower fees = Better for traders (lower costs)
• Ideal fee balances income vs. volume`;
};

// Impermanent Loss concept tooltip
export const getImpermanentLossTooltip = () => {
  return `Loss LPs face when token prices change vs. holding.

• Occurs when prices move from entry ratio
• "Impermanent" if prices return to original ratio
• More severe in volatile pairs

Risk Mitigation:
• Choose less volatile tokens
• Consider stablecoin pairs
• Balance fee income vs. potential IL`;
};

// Price Impact concept tooltip
export const getPriceImpactTooltip = () => {
  return `Effect your trade has on market price.

• Larger trades = bigger impact
• Higher impact = worse execution price
• Related to pool depth and liquidity

Tips:
• Watch impact warnings
• Break large trades into smaller ones
• Higher TVL pools offer lower impact`;
}; 