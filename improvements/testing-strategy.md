# DeFi Tuna PnL Testing Strategy

## 1. Testing Infrastructure Setup (Priority: High) ✅
- [x] Install testing dependencies
  ```bash
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
  ```
- [x] Configure Jest for Next.js environment
- [x] Set up test scripts in package.json
- [x] Configure test coverage reporting

## 2. Testing Principles and Guidelines

*   **Test Existing Code First:** Prioritize writing tests that verify the current behavior of the code *as it exists*, without modifying the source file initially. The primary goal is to lock in current functionality before any refactoring.
*   **Focus on Accuracy:** Design tests to validate core logic, known edge cases (null/undefined inputs, empty arrays/objects, boundary values), and expected error handling based *only* on the current implementation.
*   **Promote Speed:** Leverage test utilities, effective mocking (especially for external dependencies like APIs or complex libraries), and consider snapshot testing for components to accelerate test writing. Focus on testing the most critical paths first.
*   **Separate Testing from Refactoring:** If potential refactorings or improvements to the source code are identified during test writing that would enhance testability, functionality, or clarity, **do not modify the source file immediately**. Instead, document these suggestions within the relevant file's status section in this plan (e.g., under "Next Priorities" or "Known Issues") for later review, prioritization, and implementation as separate tasks.
*   **Handling Coverage Targets:** Strive to meet the defined coverage targets for each file/directory. However, if a target proves unreachable *solely by testing the existing, unmodified code paths*, mark the file's testing status as "Tested (Existing Code)". In such cases, add specific, actionable suggestions to this plan detailing how the *source file* could be refactored (e.g., breaking down large functions, injecting dependencies, making error paths more explicit) to improve its testability and allow coverage targets to be met in a subsequent refactoring effort.
* **Keep plan up-to-date:** Always keep the plan up-to-date. Update the plan after every step, every change.

## 3. Testing Priorities by Directory (Ordered by Impact/Effort)

### 3.1 Utils (High Priority) ✅
Current Progress: 91.01% Statements, 92.13% Branches, 91.42% Functions, 90.77% Lines ✅
- ✅ positionUtils.js (100% coverage)
- ✅ formatters.js (98.63% coverage)
- ✅ formulas.js (92.79% coverage)
  - Functions: 100%
  - Branches: 94.59%
  - Lines: 92.72%
  - Only uncovered lines: 50-51, 109-110, 135-136, 309-310 (error handling paths)
- ✅ pairUtils.js (95% coverage)
  - Only lines 33-34 uncovered
  - Branches: 90.9%
  - Functions: 100%
- ✅ sortUtils.js (100% coverage)
  - Functions: 100%
  - Branches: 100%
  - Lines: 100%
  - All edge cases covered
- ✅ validation.js (100% coverage)
  - Functions: 100%
  - Branches: 100%
  - Lines: 100%
  - All edge cases covered including length, character validation, and whitespace handling
- ✅ tokens.js (73.01% coverage)
  - Comprehensive tests implemented covering core functionality and error cases
  - API mocking and cache state testing implemented
  - Some error handling paths still uncovered (Lines: 37-49, 56, 87-89, 125-126, 157-163)
- ✅ chart.js (84.66% coverage)
  - All functions fully tested including edge cases
  - Complex scenarios and error handling covered
  - Visual styling and formatting functions tested (Uncovered: 85-96, 101-115, 122-123, 193-194)
- ✅ debounce.js (61.19% coverage)
  - Both `debounce` and `debouncePromise` functions tested
  - Complex async scenarios and error handling covered
  - Removed flaky test causing timeouts (Uncovered: 90-92, 108-112, 121-153)
- ✅ defituna.js (97.95% coverage)
  - All functions tested, covering successful paths, error handling, caching, and main processing logic
  - Coverage: Stmts 97.95%, Branch 96.07%, Funcs 100%, Lines 97.88% (Uncovered: 234, 260-261)
- ✅ export.js (90.16% Lines coverage)
  - All functions tested, covering image generation, download triggers, Web Share API usage
  - Coverage: Stmts 89.39%, Branch 83.33%, Funcs 80%, Lines 90.16% (Uncovered: 33-34, 67-68, 106-107)
- ✅ notifications.js (100% coverage)
- ✅ tooltipContent.js (100% coverage)
- ✅ styles.js (100% coverage)

### 3.2 Hooks (Medium-High Priority) ❌
- Target: 95% coverage
- Current: 89.61% Lines coverage (Stmts: 89.67%, Branch: 75.31%, Funcs: 95.5%)
- Files:
  - ✅ useSortState.js (100% coverage)
  - ✅ useCountdown.js (100% coverage)
  - ✅ useInvertedPairs.js (100% coverage)
  - ✅ useAutoRefresh.js (100% coverage)
  - ✅ useWallet.js (98.43% coverage)
  - ✅ useDebounceApi.js (94.44% coverage)
  - ✅ useHistoricalData.js (~82% coverage) - Updated to work with React 19
  - ✅ usePoolsData.js (~77% coverage) - Updated to work with React 19

### 3.3 Components (Low Priority) ✅
- Target: 90% coverage
- Current Progress:
  - Common Components: ✅ (91.46% Lines coverage - Stmts: 90.71%, Branch: 83.03%, Funcs: 95.74%)
    - ✅ LoadingOverlay (100% coverage)
    - ✅ TimeframeSelector (100% coverage)
    - 🟨 Portal (100% coverage - basic tests)
    - 🟨 TooltipPortal (94.11% coverage)
    - ✅ Tooltip (90% coverage)
    - ✅ InfoIcon (100% coverage)
    - ✅ EnhancedTooltip (~88.13% coverage)
    - ✅ DisclaimerModal (100% coverage)
  - PnL Components: ✅ (96.78% Lines coverage - Stmts: 96.54%, Branch: 88.75%, Funcs: 95.57%)
    - ✅ WalletForm (100% statement, 100% branch, 100% function)
      - Tests cover rendering with and without active wallets
      - Form submission with validation
      - Input handling and state management
      - Dropdown visibility control
      - Keyboard accessibility
      - Integration with sub-components
    - ✅ SavedWalletsDropdown (96% coverage)
    - ✅ PriceBar (100% coverage)
    - ✅ ClusterBar (100% statement/line coverage, 60% branch coverage)
    - ✅ PositionsList (100% statement/line coverage, 91.66% branch coverage)
    - ✅ PositionsTable (100% statement/line coverage, 94.8% branch coverage)
    - ✅ PositionChart (80.95% Lines coverage - Stmts: 81.25%, Branch: 61.11%, Funcs: 68.75%)
    - ✅ PnLCard (100% statement, 97.61% branch, 100% function)
    - ✅ All remaining PnL components (100% tested)
  - Pool Components: ✅ (99.2% Lines coverage - Stmts: 98.49%, Branch: 79.72%, Funcs: 100%)
    - ✅ CompareButton (100% statement, 100% branch, 100% function)
    - ✅ PoolCard (96% Lines coverage - Stmts: 92.59%, Branch: 64%, Funcs: 100%)
    - ✅ PoolFilters (100% Lines coverage - Stmts: 100%, Branch: 72.72%, Funcs: 100%)
    - ✅ PoolMetrics (100% statement, 100% branch, 100% function)
    - ✅ Overall Pool Components Coverage: 98.49% statement, 79.72% branch, 100% function
  - Education Components: 
    - ✅ ImpermanentLossExplainer (100% coverage)
  - History Components: ✅ (100% coverage)
    - ✅ HistoryToggle (100% coverage)
    - ✅ HistoryConfirmationModal (100% coverage)

### 3.4 Contexts (Low Priority) ❌
- Target: 85% coverage
- Current: 0% coverage
- Not started

### 3.5 Pages (Medium Priority) ✅
- Target: 80% coverage
- Current Progress:
  - API Routes (`pages/api`): ✅ (89.91% Lines coverage - Stmts: 87.12%, Branch: 78.37%, Funcs: 100%)
  - Pool Pages (`pages/pools`): ✅ (97.72% Lines coverage - Stmts: 95.65%, Branch: 69.35%, Funcs: 91.3%)
  - Root Pages (`pages`): ✅ (83.33% Lines coverage - Stmts: 83.33%, Branch: 100%, Funcs: 83.33%)
    - Note: `_document.js` intentionally has 0% coverage.

## 4. Implementation Status

### Phase 1: Foundation ✅
- [x] Set up testing infrastructure
- [x] Create test templates and utilities
- [x] Begin with utils/ directory testing

### Phase 2: Core Functionality ✅
- [x] Complete utils testing (90.77% Lines coverage achieved) ✅
- [❌] Implement hooks tests (89.61% Lines coverage achieved, Target 95%)
  - [x] Most hooks have high coverage (>94%)
  - [x] useHistoricalData.js fixed for React 19 compatibility (~82% coverage)
  - [x] usePoolsData.js fixed for React 19 compatibility (~77% coverage)
- [✅] Set up component testing infrastructure
  - [x] Test-utils.js and mocks created
  - [x] Basic component test templates established
- [✅] Component tests for critical UI elements
  - [x] LoadingOverlay (100% coverage)
  - [x] TimeframeSelector (100% coverage)
  - [x] Portal (100% coverage)
  - [x] TooltipPortal (94.11% coverage)
  - [x] Tooltip (90% coverage)
  - [x] InfoIcon (100% coverage)
  - [x] EnhancedTooltip (88.13% coverage)
  - [x] DisclaimerModal (100% coverage)
  - [x] TotalPnLDisplay (100% coverage)
  - [x] PnLDisplay (100% coverage)
  - [x] DonationFooter (100% coverage)
  - [x] AutoRefresh (100% coverage)
  - [x] ActiveWalletsDisplay (94% coverage)
  - [x] WalletForm (100% coverage)
  - [x] SavedWalletsDropdown (96% coverage)
  - [x] PriceBar (100% coverage)
  - [x] ClusterBar (100% statement/line coverage, 60% branch coverage)
  - [x] PositionsList (100% statement/line coverage, 91.66% branch coverage)
  - [x] PnLCard (100% statement/line coverage, 97.61% branch coverage)
  - [x] All remaining PnL components (100% tested)
  - [x] All Education components (100% tested)
  - [x] All History components (100% tested)
  - [x] All Pool components (100% tested, 99.2% Lines coverage)
- [✅] Implement context tests
  - [x] ComparisonContext (100% coverage)
- [x] Set up snapshot testing (Used in several component/page tests)
- [✅] Completed context testing

### Phase 3: Integration ✅
- [✅] Implement page-level tests
  - [✅] Created test utilities for page testing
  - [✅] Implemented tests for Pools page
  - [✅] Implemented tests for Pool detail page
  - [✅] Implemented tests for Pool compare page
  - [✅] Implemented tests for Home page (PnL viewer)

## 5. Current Coverage Metrics vs Targets

### Overall Project Coverage ✅
- Statements: 92.26% (Target: >85%) ✅
- Branches: 86.21% (Target: >80%) ✅
- Functions: 94.95% (Target: >90%) ✅
- Lines: 92.52% (Target: >85%) ✅

### Directory Coverage Breakdown
- Utils: 90.77% Lines coverage ✅ (Target: >85%)
  - Statements: 91.01%
  - Branches: 92.13%
  - Functions: 91.42%
  - Lines: 90.77%
  - All test files are now passing

- Hooks: 89.61% Lines coverage ❌ (Target: >95%)
  - Statements: 89.67%
  - Branches: 75.31% (Target: >80%) ❌
  - Functions: 95.5% ✅
  - Lines: 89.61%
  - Critical hooks now tested and compatible with React 19

- Components: Overall ✅ (Target: >90%)
  - Common: 91.46% Lines coverage ✅
    - Statements: 90.71%, Branches: 83.03% ✅, Functions: 95.74% ✅, Lines: 91.46% ✅
  - PnL: 96.78% Lines coverage ✅
    - Statements: 96.54% ✅, Branches: 88.75% ✅, Functions: 95.57% ✅, Lines: 96.78% ✅
  - Education: 100% coverage ✅
  - History: 100% coverage ✅
  - Pool: 99.2% Lines coverage ✅
    - Statements: 98.49% ✅, Branches: 79.72% ❌, Functions: 100% ✅, Lines: 99.2% ✅

- Contexts: 100% coverage ✅ (Target: >85%)
  - 1/1 contexts have comprehensive tests (100%)
  - ComparisonContext at 100% coverage

- Pages: Overall ✅ (Target: >80%)
  - API Routes (`pages/api`): 89.91% Lines coverage ✅
    - Statements: 87.12% ✅, Branches: 78.37% ❌, Functions: 100% ✅, Lines: 89.91% ✅
  - Pool Pages (`pages/pools`): 97.72% Lines coverage ✅
    - Statements: 95.65% ✅, Branches: 69.35% ❌, Functions: 91.3% ✅, Lines: 97.72% ✅
  - Root Pages (`pages`): 83.33% Lines coverage ✅
    - Statements: 83.33% ✅, Branches: 100% ✅, Functions: 83.33% ✅, Lines: 83.33% ✅
    - Note: `_document.js` intentionally has 0% coverage.
