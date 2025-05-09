# DeFiTuna Lending Feature Implementation Plan

## Overview
This plan outlines the steps to implement a lending feature similar to DeFiTuna's lending page in our application. The feature will allow users to view lending pools and their metrics through a clean, intuitive interface.

## Objectives
- Create a comprehensive lending page as part of the existing application navigation
- Display all available lending pools with key metrics (Supply, Borrowed, Utilization, APY)
- Maintain the current app's color scheme and design language
- Optimize API calls for performance and user experience
- Allow users to customize their view by reordering columns and setting column colors

## Current Design References
- We'll follow our app's existing color scheme defined in `src/styles/variables.module.scss`
- Primary colors: #0070f3 (primary blue), #22c55e (positive/green), #ef4444 (negative/red)
- Interface will follow our established card-based, responsive design patterns

## Data Structure
Based on the network logs, we'll need to retrieve and display:
1. Vault data from `/api/v1/vaults` endpoint
2. Token metadata from `/api/v1/mints/{token}` endpoints
3. Oracle price data from `/api/v1/oracle-prices/{token}` endpoints

## Implementation Plan

### Phase 1: Backend Infrastructure

1. **Create API Proxy Endpoints** (Priority: HIGHEST) (Status: COMPLETED)
   - Create `/api/lending/vaults` endpoint to proxy DeFiTuna's vaults API
   - Create `/api/lending/token-info` endpoint for token metadata
   - Create `/api/lending/price-data` endpoint for oracle price data
   - Implement proper error handling and response validation

2. **Implement Data Transformation Layer** (Priority: HIGHEST) (Status: COMPLETED)
   - Create utility functions to transform API responses into usable format
   - Implement proper typing for all data structures
   - Add data validation and error handling

3. **Create Data Caching Strategy** (Priority: HIGHEST) (Status: COMPLETED)
   - Implement server-side caching for API responses
   - Set appropriate TTL for different data types:
     - Vault data: 30 seconds
     - Token metadata: 1 day
     - Price data: 2 minutes

### Phase 2: Data Management Hooks

1. **Create Core Data Hooks** (Priority: HIGH) (Status: COMPLETED)
   - Implement `useLendingPools` hook with proper caching
   - Add sorting and filtering capabilities (matching pools page implementation)
   - Include token metadata enrichment
   - Implement automatic refresh logic

2. **Implement Token Metadata System** (Priority: HIGH) (Status: COMPLETED)
   - Create token metadata resolution system
   - Add fallbacks for unknown tokens
   - Implement icon/logo display logic

3. **Create Price Data Integration** (Priority: HIGH) (Status: COMPLETED)
   - Implement price fetching and updating
   - Add calculation utilities for USD values
   - Create APY calculation helpers

### Phase 3: Core UI Components

1. **Create Lending Page Layout** (Priority: HIGH) (Status: COMPLETED)
   - Implement base page structure
   - Add to main navigation with "Lending" link
   - Create responsive container with proper spacing
   - Add header with total TVL display

2. **Implement Pool Card Component** (Priority: HIGH) (Status: COMPLETED)
   - Create standardized pool card design
   - Display token icon, name, key metrics
   - Implement responsive design for all screen sizes

3. **Build Pool List Component** (Priority: HIGH) (Status: COMPLETED)
   - Create grid layout for pool cards ✅
   - Implement loading and error states ✅
   - Add empty state for when no pools are available ✅
   - Implement responsive design for all screen sizes ✅

4. **Add Sorting and Filtering** (Priority: MEDIUM) (Status: COMPLETED)
   - Implement sorting by APY, TVL, utilization ✅
   - Add token filtering capabilities (match existing pools page implementation) ✅
   - Create UI controls for sort/filter options ✅
   - Add filter persistence with localStorage ✅
   - Implement saved filters functionality ✅
   - Add filtering by Supply APY ranges ✅
   - Add filtering by Borrow APY ranges ✅
   - Add filtering by Utilization ranges ✅

5. **Implement Column Customization** (Priority: MEDIUM) (Status: NOT STARTED)
   - Create a column configuration modal with up/down controls
   - Add a button to open the column configuration modal (grid view only)
   - Implement localStorage persistence for column order and colors
   - Add a reset to default option in the modal
   - Ensure column order changes are reflected immediately in the grid
   - Add color pickers for each column's text
   - Implement color preview in the configuration modal
   - Apply custom colors to column headers and cell text

### Phase 4: Visual Refinements

1. **Enhance Visual Indicators** (Priority: MEDIUM) (Status: COMPLETED)
   - Add color-coding for APY values

2. **Improve Mobile Experience** (Priority: MEDIUM) (Status: COMPLETED)
   - Optimize layout for small screens
   - Adjust font sizes and spacing
   - Enhance touch targets for mobile

3. **Add Animations and Transitions** (Priority: LOW) (Status: COMPLETED)
   - Implement subtle loading animations
   - Add transition effects for state changes
   - Create micro-interactions for better UX

### Phase 5: Additional Features

1. **Implement User Dashboard** (Priority: LOW) (Status: NOT STARTED)
   - Show user's active lending positions
   - Display earned interest and current value

2. **Add Historical Data** (Priority: LOW) (Status: NOT STARTED)
   - Implement APY history charts
   - Show utilization trends
   - Display pool performance metrics

3. **Create Educational Content** (Priority: LOW) (Status: NOT STARTED)
   - Add tooltips explaining lending concepts
   - Implement risk assessment indicators
   - Create guides for new users

## UI Components Breakdown

### LendingPage
- Main container for the lending feature
- Header with title and TVL
- Pool list with cards
- Filter and sort controls
- Column configuration button (grid view only)

### PoolCard
- Token icon and name
- Key metrics (Supply, Borrowed, Utilization, APY)
- Visual indicators for rates

### FilterBar
- Sorting options dropdown
- Token filter options
- Search input
- Reset filters button

### ColumnConfigModal
- List of available columns with up/down arrow controls
- Color picker for each column
- Color preview showing how colors will appear
- Drag and drop support (optional enhancement)
- Reset to default button
- Save/Cancel buttons
- Visual indicator of current column order

## API Integration Details

### GET /api/lending/vaults
Returns all available lending vaults with the following data:
- `address`: Vault address
- `mint`: Token mint address
- `deposited_funds`: Amount and USD value of deposited funds
- `borrowed_funds`: Amount and USD value of borrowed funds
- `supply_limit`: Maximum supply amount and USD value
- `utilization`: Ratio of borrowed to deposited funds
- `supply_apy`: Annual Percentage Yield for lenders
- `borrow_apy`: Annual Percentage Yield for borrowers

### GET /api/lending/token-info/:mint
Returns metadata for a specific token:
- `mint`: Token mint address
- `symbol`: Token symbol
- `logo`: URL to token logo image
- `decimals`: Token decimal places

### GET /api/lending/price-data/:mint
Returns current price data for a token:
- `mint`: Token mint address
- `price`: Current price in reference currency
- `decimals`: Decimal places for price
- `time`: Timestamp of price update

## Task List with Priorities

1. **Create API Proxy Endpoints** (Priority: HIGHEST) (Status: COMPLETED)
2. **Implement Data Transformation Layer** (Priority: HIGHEST) (Status: COMPLETED)
3. **Create Data Caching Strategy** (Priority: HIGHEST) (Status: COMPLETED)
4. **Add Lending Page to Navigation** (Priority: HIGHEST) (Status: NOT STARTED)
5. **Create Core Data Hooks** (Priority: HIGH) (Status: COMPLETED)
6. **Implement Token Metadata System** (Priority: HIGH) (Status: COMPLETED)
7. **Create Price Data Integration** (Priority: HIGH) (Status: COMPLETED)
8. **Create Lending Page Layout** (Priority: HIGH) (Status: COMPLETED)
9. **Implement Pool Card Component** (Priority: HIGH) (Status: COMPLETED)
10. **Build Pool List Component** (Priority: HIGH) (Status: COMPLETED)
11. **Add Sorting and Filtering** (Priority: MEDIUM) (Status: COMPLETED)
12. **Implement Column Reordering Modal** (Priority: MEDIUM) (Status: NOT STARTED)
13. **Setup localStorage Persistence for Column Order** (Priority: MEDIUM) (Status: NOT STARTED)
14. **Add Column Color Customization** (Priority: MEDIUM) (Status: NOT STARTED)
15. **Implement Color Picker Component** (Priority: MEDIUM) (Status: NOT STARTED)
16. **Enhance Visual Indicators for APY Values** (Priority: MEDIUM) (Status: COMPLETED)
17. **Optimize Layout for Mobile** (Priority: MEDIUM) (Status: COMPLETED)
18. **Add Loading Animations** (Priority: LOW) (Status: NOT STARTED)
19. **Create User Dashboard for Viewing Positions** (Priority: LOW) (Status: NOT STARTED)
20. **Implement APY History Charts** (Priority: LOW) (Status: NOT STARTED)
21. **Add Educational Content and Tooltips** (Priority: LOW) (Status: NOT STARTED)

## Data Structure for Column Configuration

```javascript
// Column configuration data structure to be stored in localStorage
const columnConfig = {
  order: ['pool', 'supply', 'borrowed', 'utilization', 'supplyAPY', 'supplyLimit'],
  visible: {
    pool: true,
    supply: true,
    borrowed: true,
    utilization: true,
    supplyAPY: true, 
    supplyLimit: true
  },
  colors: {
    pool: null, // null means use default text color
    supply: '#0070f3', // blue
    borrowed: '#ef4444', // red
    utilization: '#f59e0b', // orange
    supplyAPY: '#22c55e', // green
    supplyLimit: null // default
  }
};

// localStorage key
const STORAGE_KEY = 'lending_column_config';
```

## Column Customization Implementation Details

1. **User Experience Flow**:
   - User clicks on "Configure Columns" button in grid view
   - Modal opens showing current column order with color indicators
   - User can click up/down arrows to change position
   - User can click on color swatch to open color picker for each column
   - Changes are previewed in real-time
   - On save, the new order and colors are stored in localStorage and applied to the grid
   - On page reload, the stored configuration is retrieved and applied

2. **Required Components**:
   - `ColumnConfigButton` - Visible only in grid view
   - `ColumnConfigModal` - Modal with column reordering UI
   - `ColorPicker` - Component for selecting column text colors
   - `ColumnOrderManager` - Utility to manage the order state and localStorage
   - `ColorPreview` - Component to show how colors will look in the grid

3. **LocalStorage Integration**:
   - Save column order and colors on change
   - Load column order and colors on page load
   - Fallback to default order and colors if no saved configuration exists
   - Handle version changes gracefully (if column definitions change)

4. **Color Application Logic**:
   - Apply colors to both column headers and cell text
   - Use CSS variables to apply colors consistently
   - Create fallbacks when colors would cause readability issues
   - Ensure sufficient contrast with background colors

## Success Metrics
- User engagement with lending feature
- User feedback on UI/UX
- Performance metrics (load time, response time)
- Usage of column reordering and color customization features

## Technical Considerations
- Ensure API error handling is robust
- Implement proper loading states for all async operations
- Optimize data fetching with appropriate caching strategies
- Ensure responsive design works on all device sizes
- Follow accessibility best practices throughout implementation
- Ensure column reordering works well on all supported browsers
- Verify color contrast meets accessibility standards 