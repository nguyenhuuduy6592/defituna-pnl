# DeFiTuna PnL Tracker Enhancement Plan

This document outlines the planned enhancements for the DeFiTuna PnL Tracker application. These features aim to provide additional value beyond what's available on the main DeFiTuna trading platform.

## 1. Historical PnL Tracking and Visualization

**Priority: High**  
**Status: Not Started**

### Description
Track and visualize PnL changes over time using client-side storage, allowing users to see the historical performance of their positions rather than just the current snapshot.

### Implementation Notes
- Use browser localStorage or IndexedDB for client-side data persistence
- Implement periodic snapshots when the app is open
- Create visualizations with lightweight charting libraries
- Add date range selectors (24h, 7d, 30d, all-time) for the stored data

## 2. Position Performance Comparisons

**Priority: Medium**  
**Status: Not Started**

### Description
Enable comparative analysis between positions to help users understand which strategies are performing best.

### Implementation Notes
- Calculate performance metrics on the client side
- Create side-by-side comparison views
- Add sorting and filtering capabilities
- Include visual indicators for top/bottom performers

## 3. Portfolio Diversification Analysis

**Priority: Medium**  
**Status: Not Started**

### Description
Help users understand how their capital is allocated across different assets and strategies, highlighting potential concentration risks.

### Implementation Notes
- Calculate token exposure across all positions in real-time
- Create allocation visualizations (pie charts, treemaps)
- Develop a simple diversification scoring system
- Calculate and display concentration metrics

## 4. Custom Alerts and Notifications

**Priority: High**  
**Status: Partially Implemented**

### Description
Expand the existing alerts system to cover more scenarios and provide browser notifications.

### Implementation Notes
- Enhance the current alerts framework
- Add support for additional alert triggers:
  - PnL threshold alerts (absolute and percentage-based)
  - Liquidation risk warnings
  - Yield opportunity notifications
  - Price movement alerts
- Use browser notifications API
- Store alert settings in localStorage

## 5. Strategy Simulation and Optimization

**Priority: Medium**  
**Status: Not Started**

### Description
Provide client-side tools for users to simulate adjustments to their positions and optimize their strategies based on current data.

### Implementation Notes
- Create a simple simulation engine that runs entirely in the browser
- Build a user-friendly interface for adjusting simulation parameters
- Provide visual comparisons between current positions and simulated outcomes
- Focus on what-if scenarios without requiring server-side computation

## 6. Multi-Wallet Portfolio View

**Priority: High**  
**Status: Partially Implemented**

### Description
Expand the existing wallet management to support viewing multiple wallets simultaneously for a holistic portfolio view.

### Implementation Notes
- Enhance the current wallet selection to allow multiple active wallets
- Implement data aggregation across selected wallets
- Add wallet grouping and labeling stored in localStorage
- Create a consolidated portfolio dashboard

## 9. Scenario Planning and Risk Assessment

**Priority: High**  
**Status: Not Started**

### Description
Help users understand potential risks and outcomes under different market conditions, calculated entirely on the client side.

### Implementation Notes
- Develop basic "what-if" scenario modeling
- Implement client-side liquidation threshold calculations
- Create a simple risk scoring system
- Allow users to save scenarios in localStorage for future reference