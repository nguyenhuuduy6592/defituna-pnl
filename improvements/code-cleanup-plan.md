# Code Cleanup and Refactoring Plan

## Overview
This plan outlines a systematic approach to improve code readability and maintainability without changing any existing functionality. The focus is on making the codebase cleaner, easier to read, and easier to maintain.

## Status Legend
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⚫ Blocked

## Phase 1: Component Structure & Organization 🟢

### 1. Consistent Component Structure 🟢
- [x] Standardize import order (React hooks, components, utils, styles)
- [x] Group related state variables together
- [x] Move callback functions below state declarations
- [x] Ensure prop destructuring follows consistent patterns

### 2. Extract Complex Logic 🟢
- [x] Move complex data transformations to separate utility functions
- [x] Extract large JSX sections into smaller sub-components
- [x] Create dedicated hooks for repeated state management patterns

### 3. Component Simplification 🟢
- [x] Break down large components (>250 lines) into smaller ones
- [x] Move business logic outside of render functions
- [x] Refactor inline anonymous functions to named functions

## Phase 2: JavaScript Cleanup 🟢

### 1. Redundant Logic Removal 🟢
- [x] Identify and eliminate duplicate code blocks
- [x] Remove commented-out code that's no longer needed
- [x] Check for and remove redundant null/undefined checks

### 2. Performance Optimizations 🟢
- [x] Use proper dependency arrays in useEffect and useCallback
- [x] Add memoization with useMemo for expensive calculations
- [x] Apply React.memo to appropriate components

### 3. Code Readability 🟢
- [x] Add meaningful variable names (avoid abbreviations)
- [x] Use destructuring for cleaner prop and state access
- [x] Replace complex conditions with readable helper functions
- [x] Use early returns to reduce nesting

## Phase 3: CSS/Styling Cleanup 🟡

### 1. Style Organization 🟢
- [x] Group related styles together (layout, typography, colors)
- [x] Use consistent naming convention for CSS classes
- [x] Remove unused styles and duplicate declarations
- [x] Properly scope CSS Module selectors
- [x] Implement SASS variables and mixins consistently

### 2. Style Simplification 🔴
- [ ] Consolidate similar styles into reusable classes
- [ ] Extract common values into CSS variables
- [ ] Reduce specificity where possible for easier overrides
- [ ] Create dedicated style modules for components
- [ ] Remove duplicate styles between components

### 3. Responsive Design Cleanup 🟡
- [x] Organize media queries consistently
- [ ] Remove redundant responsive styles
- [x] Ensure mobile-first approach consistently
- [x] Use SASS mixins for breakpoints

## Phase 4: Project-wide Improvements 🟡

### 1. TypeScript Improvements (if applicable) 🔴
- [ ] Add or improve type definitions
- [ ] Remove any/unknown types where possible
- [ ] Create reusable type definitions for common structures

### 2. Documentation 🟢
- [x] Add JSDoc comments to complex functions
- [x] Document component props with PropTypes or TypeScript
- [x] Add examples for reusable components

### 3. File Organization 🟢
- [x] Group related components in appropriate directories
- [x] Create index files for cleaner imports
- [x] Organize utility functions by domain/purpose

## Implementation Approach

### For Each Component
1. Document current behavior and props ✅
2. Identify redundant or overly complex sections ✅
3. Refactor in small, testable increments ✅
4. Verify functionality remains unchanged ✅
5. Document changes made ✅

### Priority Components
1. `PositionsList.js` ✅ - Split into smaller components, added custom hooks
2. `PnLDisplay.js` ✅ - Split into smaller components, improved error handling
3. Core utility files (`positionUtils.js`, `formatters.js`) ✅ - Refactored for clarity, consistency, and error handling
4. Higher-order components and context providers ✅ - N/A (No custom HOCs or Contexts found)
5. Shared UI components 🟡 - Table components completed

## Testing Strategy
- ✅ Ensure visual regression tests pass
- ✅ Manually verify all interactions work as before
- ✅ Test edge cases (empty data, loading states, errors)
- ✅ Confirm all optimized API responses still display correctly

## Progress Tracking

### Components
| Component/File | Status | Notes |
|----------------|--------|-------|
| common/LoadingOverlay.js | 🟢 Completed | Added proper JSDoc, improved readability, extracted overlay class name |
| common/DisclaimerModal.js | 🟢 Completed | Extracted subcomponents, added useCallback for event handlers, improved readability |
| common/Tooltip.js | 🟢 Completed | Added JSDoc, improved accessibility |
| common/TooltipPortal.js | 🟢 Completed | Extracted positioning logic with useCallback, improved performance with memoization |
| common/Portal.js | 🟢 Completed | Added JSDoc comments, standardized structure |
| history/HistoryConfirmationModal.js | 🟢 Completed | Extracted content components, created helper functions, improved accessibility |
| history/HistoryToggle.js | 🟢 Completed | Added proper JSDoc, optimized handlers with useCallback, improved structure |
| pnl/ClusterBar.js | 🟢 Completed | Extracted BarSegment and TooltipRow components, optimized with useMemo and useCallback, added aria attributes |
| pnl/WalletForm.js | 🔴 Not Started |  |
| pnl/SavedWalletsDropdown.js | 🟢 Completed | Extracted SavedWalletItem component, added keyboard navigation, optimized with useCallback and React.memo |
| pnl/ActiveWalletsDisplay.js | 🟢 Completed | Extracted WalletChip component, applied React.memo, improved accessibility |
| pnl/PriceBar.js | 🟢 Completed | Extracted PriceMarker and TooltipRow components, optimized with useMemo and useCallback, added aria attributes |
| pnl/PnLCard.js | 🔴 Not Started |  |
| pnl/AutoRefresh.js | 🟢 Completed | Extracted subcomponents, added useCallback, improved accessibility |
| pnl/PositionChart.js | 🔴 Not Started |  |
| pnl/PositionsTable.js | 🔴 Not Started |  |
| pnl/PositionsList.js | 🔴 Not Started |  |
| pnl/DonationFooter.js | 🟢 Completed | Added useCallback for handlers, improved accessibility with tabIndex |
| pnl/TotalPnLDisplay.js | 🟢 Completed | Added useMemo for formatted values, improved accessibility |
| pnl/PnLDisplay.js | 🟢 Completed | Added proper data validation with useMemo, improved component structure |

### Styles
| Style File | Status | Notes |
|----------------|--------|-------|
| PositionsTable.module.scss | 🟢 Completed | Dedicated styles with proper scoping and SASS variables |

### Hooks
| Hook File | Status | Notes |
|----------------|--------|-------|
| useSortState.js | 🟢 Completed | New hook for sort state management |
| useInvertedPairs.js | 🟢 Completed | New hook for inverted pairs management |
| usePositionAges.js | 🟢 Completed | New hook for calculating position ages with error handling |
| useWallet.js | 🔴 Not Started | Wallet management hook |
| useDebounceApi.js | 🔴 Not Started | API call debouncing |
| useHistoricalData.js | 🔴 Not Started | Historical data management |
| useAutoRefresh.js | 🔴 Not Started | Auto-refresh logic |
| useCountdown.js | 🔴 Not Started | Countdown timer hook |

### Utils
| Utility File | Status | Notes |
|----------------|--------|-------|
| sortUtils.js | 🟢 Completed | New utility file for sorting functions |
| positionUtils.js | 🟢 Completed | Refactored decoding, status calculation, and styling utils |
| defituna.js | 🟡 In Progress | Main API integration utilities |
| formulas.js | 🔴 Not Started | Financial calculations |
| helius.js | 🔴 Not Started | Helius API integration |
| debounce.js | 🔴 Not Started | Debouncing utilities |
| validation.js | 🔴 Not Started | Form validation |
| notifications.js | 🔴 Not Started | User notifications |
| pairUtils.js | 🔴 Not Started | Token pair utilities |
| formatters.js | 🟢 Completed | Refactored number, value, duration, and address formatters |
| constants.js | 🔴 Not Started | Global constants |
| chart.js | 🟢 Completed | Added chart-specific formatters and tooltip component logic |
| export.js | 🔴 Not Started | Data export functions |
| styles.js | 🔴 Not Started | Style utilities |

### Pages
| Page File | Status | Notes |
|----------------|--------|-------|
| pages/index.js | 🔴 Not Started | Main application page |
| pages/_app.js | 🔴 Not Started | Next.js app wrapper |
| pages/_document.js | 🔴 Not Started | Next.js document setup |
| pages/index.module.scss | 🔴 Not Started | Main page styles |

### API Routes
| API File | Status | Notes |
|----------------|--------|-------|
| pages/api/fetch-pnl.js | 🟡 In Progress | Main PnL fetching endpoint |
| pages/api/fetch-position-age.js | 🔴 Not Started | Position age endpoint |

## Recent Style Improvements ✅
- [x] Fixed CSS Module build errors with proper selector scoping
- [x] Implemented consistent class naming for status and value cells
- [x] Enhanced button and interaction styles with proper transitions
- [x] Improved table layout and cell padding consistency
- [x] Added proper SASS variable usage throughout styles
- [x] Created dedicated style modules for components
- [x] Removed duplicate styles between components
- [x] Improved responsive design with SASS mixins
- [x] Fixed missing state and value styling classes in PositionsTable component

## Completion Checklist
- [x] Phase 1: Component Structure & Organization
- [x] Phase 2: JavaScript Cleanup
- [ ] Phase 3: CSS/Styling Cleanup
- [ ] Phase 4: Project-wide Improvements
- [x] Priority components initial refactor
- [x] Style organization completed
- [x] No regressions in functionality
- [ ] Enfore imported from index files instead of direct items under hooks and utils
- [ ] Code review completed
- [ ] Documentation updated

## Progress Notes (March 30)
- Completed 12 of 20 components (60%)
- All common and history components refactored (100%)
- 7 of 13 PNL components refactored (54%)
- Applied consistent patterns across components
- Enhanced accessibility throughout the application
- Added thorough JSDoc documentation to all refactored components
- Improved performance with React.memo, useCallback, and useMemo
- Extracted reusable subcomponents to simplify complex components
- Maintained backward compatibility for existing component imports
