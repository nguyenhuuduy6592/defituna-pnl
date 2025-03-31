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
   - Implemented client-side caching with localStorage:
     * Added 1-hour TTL for pool data to reduce API calls
     * Store complete pools data and filter options in browser storage
     * Automatic refresh when cache expires or on manual refresh
     * Improved performance with client-side filtering and sorting
   
2. ✅ Build token metadata system
   - Create token metadata resolution from mints endpoint
   - Implement fallbacks for unknown tokens
   - Add error boundaries for metadata lookups

3. ✅ Optimize API handling
   - Eliminated redundant API calls for individual pools
   - Consolidated pool data fetching to use a single API endpoint
   - Improved pool detail page to use data from the all pools cache

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

### Phase 5: Insightful Analytics & Visualization 🔄 IN PROGRESS
*Focus: Transform raw data into actionable insights.*

1.  ✅ **Implement Key Derived Metrics**: (completed)
    *   ✅ Created API backend in `/api/pools.js` for:
        * Fee APR calculation (based on `fees` / `tvl_usdc` over timeframes)
        * Volume/TVL Ratio calculation (capital efficiency indicator)
        * Volatility classification (Low/Medium/High)
    *   ✅ Implemented usePoolData hook with caching for efficient data retrieval
    *   ✅ Created PoolMetrics component to display derived metrics
    *   ✅ Fixed data fetching and calculation issues:
        * Corrected API data structure handling for DeFiTuna API responses
        * Properly parsed string numeric values returned by the API
        * Implemented proper error handling throughout the data flow
        * Added detailed logging for troubleshooting
    *   ✅ Integration completed:
        * Added metrics to Pool Detail page with Performance Metrics section
        * Added metrics to Pool Cards

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

### Phase 6: User Convenience & Decision Support 🔄 IN PROGRESS
*Focus: Make it easier for users to track, compare, and act.*

1.  🔄 **Enhance Pool Comparison**:
    *   Create a simple mechanism to select 2-3 pools for a direct side-by-side comparison view.
    *   Focus the comparison on key differentiating metrics (Fee APR, TVL, Volume/TVL, Volatility Indicators, Fees).
    *   **Value add**: Streamline the process of choosing between specific pools.
    *   **Action Item**: Design and implement the comparison selection and view.

2.  ✅ **Add Filter Management**:
    *   ✅ Implemented the ability to save current filter and sorting settings:
        * Created a "Save" button next to Reset to store current filters
        * Added automatic labeling based on filter selections
        * Saved filters use localStorage for persistence between sessions
        * Implemented duplicate detection to prevent redundant filters
    *   ✅ Enhanced the filter interface:
        * Added a dedicated "Saved Filters" area visible when filters exist
        * Provided one-click application of saved filters
        * Added the ability to delete saved filters
    *   ✅ UI Refinements:
        * Improved filter labels with readable names for metrics (e.g., "Yield" instead of "yield_over_tvl")
        * Added proper labeling for the Timeframe selector
        * Enhanced alignment of filter controls for better visual consistency
        * Fixed vertical alignment of buttons with other form elements
    *   **Value add**: Help users quickly find pools matching their criteria and save custom views.

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

4. ✅ Optimized Performance
   - Implemented client-side caching to reduce API calls
   - Fixed redundant data fetching in individual pool pages
   - Improved data consistency by using a single data source
   - Reduced server load with smarter fetching strategy
   - Enhanced app responsiveness with client-side filtering

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
