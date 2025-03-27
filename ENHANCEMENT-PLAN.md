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
**Status: Completed**

### Description
Expand the existing wallet management to support viewing multiple wallets simultaneously for a holistic portfolio view.

### Implementation Notes
- Enhance the current wallet selection to allow multiple active wallets
- Implement data aggregation across selected wallets
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

## 10. Solana Wallet Donation Feature

**Priority: Medium**  
**Status: Not Started**

### Description
Implement a donation system using Solana Blink to simplify the donation process. This allows users to donate with minimal friction using SOL, with USD conversion handled automatically by the Blink protocol.

### Implementation Notes
- Add a simple donation button at the bottom of the page with a default 5 USD amount with Solana Blink for easier setup
- Only show the button when the data is already loaded.
- Allow custom donation amount input
- Use Solana Blink payment links with USD/SOL conversion
- Display thank-you messages after successful donations
- Have a list of wallets as env variable, use the variable to let user send to a random wallet in the list
- Create a dedicated `/donations` page showing:
  - Transaction history
  - Amount and token name
  - Donor wallet address (truncated). list must be return from server which is already truncated.
  - Transaction timestamp

## 11. PWA Support

**Priority: High**  
**Status: Not Started**

### Description
Transform the web application into a Progressive Web App to enable offline functionality, improved performance, and native app-like experience.

### Implementation Notes
- Configure and implement service worker for offline support and caching
- Update manifest.json with proper app metadata, icons, and theme colors
- Implement app shell architecture for faster loading
- Add install prompts and handling for "Add to Home Screen"
- Configure offline fallbacks and synchronization strategies
- Implement background sync for pending transactions
- Test PWA features across different devices and browsers
- Optimize caching strategies for API responses and static assets
- Ensure proper handling of push notifications if implemented
- Validate PWA implementation using Lighthouse audits

## 12. Create PnL Card Showcase

**Priority: High**  
**Status: Completed**

### Description
Implement a visually appealing and informative PnL card system that showcases position performance in an easily digestible format. The cards should be shareable, exportable, and contain comprehensive position details in a visually appealing layout.

### Implementation Notes

#### Core Features
- Add a "Share Position" button next to each position in the PositionsList component
- Implement a modal/overlay system to display the PnL card when clicked
- Position cards should be responsive and maintain aspect ratio for sharing

#### Card Content
- Position identifier and timestamp
- Current PnL value with percentage change
- Entry and current price
- Position size and leverage
- Visual indicators for profit (green) or loss (red) status
- Token/pair information with icons
- Platform/protocol identifier
- Position state (open/closed/liquidated)
- Position age with detailed timestamp
- Yield metrics:
  - Current yield in USD
  - Compounded yield in USD
  - Debt change in USD
- Pool information:
  - Token A/B symbols
  - Token A/B mint addresses (truncated)
- SOL price at time of snapshot
- Wallet address (truncated) for multi-wallet views

#### Technical Implementation
- Create a new React component `PnLCard` with styled-components or CSS modules
- Use html2canvas or similar library for image export functionality
- Implement QR code generation using qrcode.react
  - QR code should link to the current site
  - Include proper error handling for QR generation
- Add copy to clipboard functionality for sharing links
- Implement image download in PNG format
  - Maintain high resolution for social media sharing
  - Include proper file naming convention with position details

#### Export Options
- Download as PNG button with high resolution export
- Copy to clipboard button for direct sharing
- Share button with native share API integration where supported

#### Design Requirements
- Implement a clean, modern card design
- Use consistent typography and spacing
- Follow existing app theme and color scheme
- Ensure proper contrast for readability
- Implement loading states and error handling

#### Performance Considerations
- Lazy load card generation components
- Optimize image generation and export process
- Implement proper loading states during export
