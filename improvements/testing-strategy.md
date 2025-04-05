# DeFi Tuna PnL Testing Strategy

## 1. Testing Infrastructure Setup (Priority: High) ✅
- [x] Install testing dependencies
  ```bash
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
  ```
- [x] Configure Jest for Next.js environment
- [x] Set up test scripts in package.json
- [x] Configure test coverage reporting
- [ ] Set up GitHub Actions for automated testing

## 2. Testing Principles and Guidelines

*   **Test Existing Code First:** Prioritize writing tests that verify the current behavior of the code *as it exists*, without modifying the source file initially. The primary goal is to lock in current functionality before any refactoring.
*   **Focus on Accuracy:** Design tests to validate core logic, known edge cases (null/undefined inputs, empty arrays/objects, boundary values), and expected error handling based *only* on the current implementation.
*   **Promote Speed:** Leverage test utilities, effective mocking (especially for external dependencies like APIs or complex libraries), and consider snapshot testing for components to accelerate test writing. Focus on testing the most critical paths first.
*   **Separate Testing from Refactoring:** If potential refactorings or improvements to the source code are identified during test writing that would enhance testability, functionality, or clarity, **do not modify the source file immediately**. Instead, document these suggestions within the relevant file's status section in this plan (e.g., under "Next Priorities" or "Known Issues") for later review, prioritization, and implementation as separate tasks.
*   **Handling Coverage Targets:** Strive to meet the defined coverage targets for each file/directory. However, if a target proves unreachable *solely by testing the existing, unmodified code paths*, mark the file's testing status as "Tested (Existing Code)". In such cases, add specific, actionable suggestions to this plan detailing how the *source file* could be refactored (e.g., breaking down large functions, injecting dependencies, making error paths more explicit) to improve its testability and allow coverage targets to be met in a subsequent refactoring effort.
* **Keep plan up-to-date:** Always keep the plan up-to-date. Update the plan after every step, every change.

## 3. Testing Priorities by Directory (Ordered by Impact/Effort)

### 3.1 Utils (High Priority) ✅
Current Progress: 91.66% overall, with individual files:
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
- ✅ tokens.js (95%+ coverage)
  - Comprehensive tests implemented covering core functionality and error cases
  - API mocking and cache state testing implemented
- ✅ chart.js (84.66% coverage)
  - All functions fully tested including edge cases
  - Complex scenarios and error handling covered
  - Visual styling and formatting functions tested
- ✅ debounce.js (74.57% coverage)
  - Both `debounce` and `debouncePromise` functions tested
  - Complex async scenarios and error handling covered
- ✅ defituna.js (97.95% coverage)
  - All functions tested, covering successful paths, error handling, caching, and main processing logic
  - Coverage: Stmts 97.95%, Branch 96.07%, Funcs 100%, Lines 97.88%
- ✅ export.js (95.45% coverage)
  - All functions tested, covering image generation, download triggers, Web Share API usage
  - Coverage: Stmts 95.45%, Branch 94.44%, Funcs 80%, Lines 96.72%
- ✅ notifications.js (100% coverage)
- ✅ tooltipContent.js (100% coverage)
- ❌ styles.js (0% coverage)

### 3.2 Hooks (Medium-High Priority) 🟨
- Target: 95% coverage
- Current: 76.65% coverage
- Files:
  - ✅ useSortState.js (100% coverage)
  - ✅ useCountdown.js (100% coverage)
  - ✅ useInvertedPairs.js (100% coverage)
  - ✅ useAutoRefresh.js (100% coverage)
  - ✅ useWallet.js (98.43% coverage)
  - ✅ useDebounceApi.js (94.44% coverage)
  - ✅ useHistoricalData.js (~82% coverage) - Updated to work with React 19
  - ✅ usePoolData.js (100% coverage)
  - ✅ usePoolsData.js (~77% coverage) - Updated to work with React 19

### 3.3 Components (Low Priority) ❌
- Target: 90% coverage
- Current Progress: 0% coverage
  - Common Components:
    - ❌ LoadingOverlay (0% coverage)
    - ❌ TimeframeSelector (0% coverage)
    - ❌ Tooltip (0% coverage)
    - ❌ TooltipPortal (0% coverage)
    - ❌ Portal (0% coverage)
    - ❌ InfoIcon (0% coverage)
    - ❌ EnhancedTooltip (0% coverage)
    - ❌ DisclaimerModal (0% coverage)
  - PnL Components: Not started (0% coverage)
  - Pool Components: Not started (0% coverage)
  - Education Components: Not started (0% coverage)
  - History Components: Not started (0% coverage)

### 3.4 Contexts (Low Priority) ❌
- Target: 85% coverage
- Current: 0% coverage
- Not started

### 3.5 Pages (Low Priority) ❌
- Target: 80% coverage
- Current: 0% coverage
- Not started

## 4. Implementation Status

### Phase 1: Foundation ✅
- [x] Set up testing infrastructure
- [x] Create test templates and utilities
- [x] Begin with utils/ directory testing
- [ ] Establish CI/CD pipeline for tests

### Phase 2: Core Functionality 🟨
- [x] Complete utils testing (91.66% coverage achieved)
- [🟨] Implement hooks tests (76.65% coverage achieved)
  - [x] Most hooks have high coverage (>94%)
  - [x] useHistoricalData.js fixed for React 19 compatibility (~82% coverage)
  - [x] usePoolsData.js fixed for React 19 compatibility (~77% coverage)
- [ ] Set up component testing infrastructure
- [ ] Create test templates for components
- [ ] Add component tests for critical UI elements (Not Started)
- [ ] Set up snapshot testing
- [ ] Begin context testing

### Phase 3: Integration ⬜
- [ ] Implement page-level tests
- [ ] Add integration tests
- [ ] Set up E2E testing framework
- [ ] Document testing patterns

## 5. Current Coverage Metrics vs Targets

### Overall Project Coverage
- Statements: 35.62% (Target: >85%) ❌
- Branches: 38.41% (Target: >80%) ❌
- Functions: 30.70% (Target: >90%) ❌
- Lines: 34.92% (Target: >85%) ❌

### Directory Coverage Breakdown
- Utils: 51.65% coverage 🟨
  - Statements: 51.65%
  - Branches: 71.40%
  - Functions: 54.28%
  - Lines: 49.82%
  - Several files have issues with import paths in tests

- Hooks: 82.79% coverage ✅
  - Statements: 82.79%
  - Branches: 73.41%
  - Functions: 88.76%
  - Lines: 82.25%
  - Critical hooks now tested and compatible with React 19

- Components: 4.21% coverage ❌
  - Most component files have 0% coverage

- Contexts: 0% coverage ❌
  - All context files have 0% coverage

- Pages: 0% coverage ❌
  - All page files have 0% coverage

## 6. Next Steps (Prioritized)

1. Fix Import Path Issues in Utils Tests:
   - Fix issues in test files that exist but fail due to incorrect import paths:
     - useDebounceApi.test.js
     - debounce.test.js
     - defituna.test.js
     - export.test.js
     - notifications.test.js
     - tooltipContent.test.js

2. Begin Component Testing:
   - Start with LoadingOverlay and TimeframeSelector components
   - Set up proper test templates for React components
   - Add snapshot testing for UI components

3. Implement Context Tests:
   - Start with ComparisonContext
   - Add tests for other context providers

4. Page Testing Strategy:
   - Define approach for testing pages with complex integration needs
   - Start with simpler page tests

5. Infrastructure:
   - Set up GitHub Actions for automated testing
   - Implement pre-commit hooks for test runs

## 7. Known Issues

- Several mock implementations might be needed for useHistoricalData.js
- Component testing requires proper DOM mocking setup
- usePoolsData.js tests may need refactoring to handle async behavior better
- Overall coverage significantly below targets
- Integration and E2E tests pending
- Need to add snapshot testing for components
- React act() warnings appear in tests for usePoolsData.js due to internal state updates

## 8. Success Metrics Update

- [x] Test infrastructure established
- [x] Most utility files fully tested (91.66% coverage)
- [🟨] Hooks testing progressing (82.79% coverage)
- [ ] Component testing strategy finalized
- [ ] CI/CD pipeline running
- [ ] Documentation complete 