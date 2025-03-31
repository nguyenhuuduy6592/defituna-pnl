# DeFiTuna Pools Feature Plan

## Overview & Goals
Provide a simple, robust, and user-friendly interface to explore DeFiTuna pools. Go beyond raw data display by offering **derived insights, contextual information, and intuitive visualizations** to help users quickly identify opportunities and understand risks, ultimately enabling better-informed decisions.

## Implementation Status & Next Steps

### Phase 1: Core Backend Infrastructure ✅ COMPLETE
1. ✅ Create backend API endpoints
   - `/api/pools` endpoint proxying DeFiTuna pools API
   - `/api/tokens` endpoint for token metadata
   - Basic error handling and validation
   
2. ✅ Implement proper data handling
   - Move all DeFiTuna API calls to backend
   - Handle API response formats correctly
   - Add proper error responses

### Phase 2: Data Management Layer ✅ COMPLETE
1. ✅ Create pools data hook
   - Implement `usePoolsData` hook with filtering
   - Add token metadata enhancement
   - Set up in-memory caching with TTL
   
2. ✅ Build token metadata system
   - Create token metadata resolution from mints endpoint
   - Implement fallbacks for unknown tokens
   - Add error boundaries for metadata lookups

### Phase 3: Core UI Components ✅ COMPLETE
1. ✅ Create main pools listing page
   - Implement grid/list view of all pools
   - Add loading and error states
   - Include navigation and page structure
   
2. ✅ Build pool card component
   - Display token pair and key metrics
   - Create consistent formatting for values
   - Implement responsive design
   
3. ✅ Add filter component
   - Implement sorting by key metrics
   - Add token filters via dropdown of available tokens
   - Create timeframe selection (24h/7d/30d)
   
4. ✅ Implement pool detail page
   - Create comprehensive pool details view
   - Display token information and statistics
   - Add technical details section

### Phase 4: Visual and UX Refinements ✅ COMPLETE
1. ✅ Enhance token display
   - Replace placeholder addresses with proper symbols
   - Add formatting for decimals and number values
   - Ensure consistent token representation
   
2. ✅ Improve value formatting
   - Create centralized formatting utilities
   - Add number abbreviations (K, M, B) for large values
   - Implement specialized fee formatter for consistent display
   - Handle small values with appropriate precision
   - Apply consistent formatting across all components

3. ✅ Add visual indicators
   - ✅ Implement color coding for metrics
     - Add color coding for yield values (green for high, orange for medium, red for low)
     - Define consistent color scheme with appropriate backgrounds
     - Apply colors to volume, TVL, and other metric values
   - ✅ Add trending indicators for changes
     - Add arrow indicators (up, down, neutral) with appropriate colors
     - Include tooltips explaining the trend comparison
     - Hide indicators when no comparison data is available (e.g., 30d view)
   - ✅ Create sorting indicators for active sorts
     - Add arrow indicators (↑/↓) in sort dropdown to show direction
   - ✅ Add visual feedback for user interactions
     - Add hover states for all interactive elements
     - Implement tooltips for additional information
     - Auto-apply filters on dropdown selection

4. ✅ Improve mobile responsiveness
   - ✅ Optimize layout for small screens
     - Make card grid responsive with proper widths
     - Fix horizontal overflow issues
     - Adjust card content to fit smaller screens
   - ✅ Adjust font sizes and spacing
     - Use smaller text for tight spaces
     - Reduce padding and margins where appropriate
   - ✅ Enhance touch targets for mobile
     - Make buttons and interactive areas appropriately sized
   - ✅ Implement responsive navigation
     - Create compact single-line filter controls
     - Stack elements appropriately on small screens

### Phase 5: Insightful Analytics & Visualization 🔄 PRIORITY
*Focus: Transform raw data into actionable insights.*

1.  🔄 **Implement Key Derived Metrics**:
    *   Calculate and display **Fee APR** (based on `fees` / `tvl_usdc` over the selected timeframe, annualized).
    *   Calculate and display **Volume / TVL Ratio** (indicates capital efficiency).
    *   Add simple **Volatility Indicators** for underlying tokens (e.g., Low/Medium/High based on recent price action - requires token price data).
    *   **Value add**: Provide clearer performance indicators (Fee APR) and risk context (Volatility) than raw stats alone.
    *   **Action Item**: Implement calculations for Fee APR and Volatility indicators. Integrate into Pool Card and Detail Page.

2.  🔄 **Create Focused Historical Charts**:
    *   Implement time-series charts on the Pool Detail page for **Fee APR** and **TVL**.
    *   Keep timeframe selection simple (7d, 30d, 90d).
    *   **Value add**: Visualize the stability and trend of returns and pool size.
    *   **Action Item**: Integrate charting library and create reusable chart components for Fee APR and TVL.

3.  🔄 **Develop Contextual Tooltips & Explanations**:
    *   Enhance all metric tooltips to explain *what the metric means for the user* and *how to interpret it* (e.g., "High Fee APR suggests good returns for LPs based on recent activity, but check volatility").
    *   Add info icons with brief explanations for key concepts like impermanent loss risk (without complex calculations yet).
    *   **Value add**: Educate users and build confidence in interpreting the data.
    *   **Action Item**: Review and rewrite all tooltips with a focus on user implications.

### Phase 6: User Convenience & Decision Support 📝 HIGH VALUE
*Focus: Make it easier for users to track, compare, and act.*

1.  📝 **Enhance Pool Comparison**:
    *   Create a simple mechanism to select 2-3 pools for a direct side-by-side comparison view.
    *   Focus the comparison on key differentiating metrics (Fee APR, TVL, Volume/TVL, Volatility Indicators, Fees).
    *   **Value add**: Streamline the process of choosing between specific pools.
    *   **Action Item**: Design and implement the comparison selection and view.

2.  📝 **Add "Quick Filter" Presets**:
    *   Create predefined filter buttons for common scenarios (e.g., "High Yield Stablecoins", "Top Volume Pools", "Newer Pools < 30d old" - requires pool age data if available).
    *   **Value add**: Help users quickly discover pools matching popular strategies.
    *   **Action Item**: Define useful presets and implement one-click filter application.

## Completed Improvements
1. ✅ Enhanced Pool Cards
   - Added color-coded backgrounds for metric values
   - Implemented trend indicators with tooltips
   - Optimized layout to fit 3 cards per row
   - Fixed card sizing and overflow issues

2. ✅ Improved Filter Component
   - Converted to compact single-line layout
   - Changed token search to dropdown of available tokens
   - Added TVL filter with sensible value ranges
   - Implemented auto-apply for filter changes

3. ✅ Enhanced User Experience
   - Added tooltips to explain metric meanings and trends
   - Improved visual hierarchy with color coding
   - Optimized responsive behavior for different screen sizes
   - Reduced visual clutter while maintaining functionality

## Core Principles for Added Value
*   **Simplicity**: Prioritize clarity over complexity. Avoid overwhelming users with too many numbers.
*   **Context**: Explain what metrics mean and why they matter.
*   **Actionability**: Focus on data and features that directly help users compare pools and make decisions.
*   **Robustness**: Ensure calculations are sound and the application is reliable.

## Success Metrics
*   User feedback indicating the tool helps them make **better/faster decisions** compared to raw data sources.
*   Active use of **derived metrics** (Fee APR) and **risk indicators** in filtering/sorting.
*   High usage of **comparison** and **watchlist** features.
*   Low bounce rate, indicating users find the presented information valuable and engaging.
