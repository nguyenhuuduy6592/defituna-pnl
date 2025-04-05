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

## 2. Testing Priorities by Directory (Ordered by Impact/Effort)

### 2.1 Utils (High Priority) ✅
Current Progress: 95%+ overall, with individual files:
- ✅ positionUtils.js (100% coverage)
- ✅ formatters.js (100% coverage)
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
- ✅ chart.js (95%+ coverage)
  - All functions fully tested including edge cases
  - Complex scenarios and error handling covered
  - Visual styling and formatting functions tested
- ✅ debounce.js (90%+ coverage)
  - Both `debounce` and `debouncePromise` functions tested
  - Complex async scenarios and error handling covered
- ✅ defituna.js (~98% coverage)
  - All functions tested, covering successful paths, error handling, caching, and main processing logic
  - Coverage: Stmts 97.95%, Branch 96.07%, Funcs 100%, Lines 97.88%
- ✅ export.js (~96% coverage)
  - All functions tested, covering image generation, download triggers, Web Share API usage
  - Coverage: Stmts 95.45%, Branch 94.44%, Funcs 80%, Lines 96.72%
- ✅ notifications.js (100% coverage)
- ✅ tooltipContent.js (100% coverage)

### 2.2 Hooks (High Priority) ✅
- Target: 95% coverage
- Current: 95%+ coverage
- Files:
  - ✅ useSortState.js (100% coverage)
  - ✅ useCountdown.js (100% coverage)
  - ✅ useInvertedPairs.js (100% coverage)
  - ✅ useAutoRefresh.js (100% coverage)
  - ✅ useWallet.js (~98% coverage)
  - ✅ useDebounceApi.js (~94% coverage)
  - ✅ useHistoricalData.js (95%+ coverage)
  - ✅ usePoolData.js (95%+ coverage)
  - ✅ usePoolsData.js (95%+ coverage)

### 2.3 Components (Medium-High Priority) 🟨
- Target: 90% coverage
- Current Progress:
  - Common Components:
    - ✅ LoadingOverlay (100% coverage)
    - ✅ TimeframeSelector (100% coverage)
    - ⬜ Tooltip
    - ⬜ TooltipPortal
    - ⬜ Portal
    - ⬜ InfoIcon
    - ⬜ EnhancedTooltip
    - ⬜ DisclaimerModal
  - PnL Components: Not started
  - Pool Components: Not started
  - Education Components: Not started
  - History Components: Not started

### 2.4 Contexts (Medium Priority) ⬜
- Target: 85% coverage
- Current: 0% coverage
- Pending implementation

### 2.5 Pages (Medium Priority) ⬜
- Target: 80% coverage
- Current: 0% coverage
- Pending implementation

## 3. Implementation Status

### Phase 1: Foundation ✅
- [x] Set up testing infrastructure
- [x] Create test templates and utilities
- [x] Begin with utils/ directory testing
- [ ] Establish CI/CD pipeline for tests

### Phase 2: Core Functionality ✅
- [x] Complete utils testing (95%+ coverage achieved)
- [x] Implement hooks tests (95%+ coverage achieved)
- [x] Set up component testing infrastructure
- [x] Create test templates for components
- [🟨] Add component tests for critical UI elements (In Progress)
  - [x] Common components started
  - [ ] PnL components
  - [ ] Pool components
  - [ ] History components
  - [ ] Education components
- [ ] Set up snapshot testing
- [ ] Begin context testing

### Phase 3: Integration ⬜
- [ ] Implement page-level tests
- [ ] Add integration tests
- [ ] Set up E2E testing framework
- [ ] Document testing patterns

## 4. Current Coverage Metrics vs Targets

### Overall Project Coverage
- Statements: 85%+ (Target: >85%) ✅
- Branches: 80%+ (Target: >80%) ✅
- Functions: 90%+ (Target: >90%) ✅
- Lines: 85%+ (Target: >85%) ✅

### Component Coverage Progress
- Common Components: ~25% (2/8 components)
- PnL Components: 0%
- Pool Components: 0%
- History Components: 0%
- Education Components: 0%

## 5. Next Steps (Prioritized)

1. Component Testing:
   - Continue with common components (Next: Tooltip & Portal components)
   - Create test templates for more complex components
   - Begin testing PnL components

2. Infrastructure:
   - Set up GitHub Actions for automated testing
   - Implement pre-commit hooks for test runs

3. Documentation:
   - Document component testing patterns
   - Create templates for new component test files

## 6. Known Issues

- Most component tests not yet implemented
- CI/CD pipeline pending setup
- Integration and E2E tests pending
- Need to add snapshot testing for components

## 7. Success Metrics Update

- [x] Test infrastructure established
- [x] All utility files fully tested
- [x] All hooks fully tested
- [x] Testing patterns established
- [x] Coverage targets met for implemented tests
- [x] Component testing infrastructure set up
- [ ] CI/CD pipeline running
- [ ] Documentation complete 