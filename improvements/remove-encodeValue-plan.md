# Plan to Remove encodeValue Function and Simplify Code

## Current Analysis

### What encodeValue Does
The `encodeValue` function converts decimal values to integers by multiplying with specific multipliers:
- `USD_MULTIPLIER = 100` (2 decimal places for USD values)
- `PRICE_MULTIPLIER = 1000000` (6 decimal places for prices)
- `LEVERAGE_MULTIPLIER = 100` (2 decimal places for leverage)

### Where encodeValue is Used

1. **src/utils/defituna.js** (lines 294-336):
   - Used in `processPositionsData()` to encode 15 different fields before sending to frontend
   - Fields encoded: prices, leverage, size, PnL, yield, compounded, collateral, debt, interest

2. **src/pages/api/fetch-pnl.js** (lines 8-13, 50):
   - Has its own duplicate `encodeValue` function
   - Used to encode the total PnL value (`t_pnl`)

### Where decodeValue is Used

1. **src/utils/positionUtils.js**:
   - `decodePosition()` function decodes all the encoded values back to decimals
   - Used by frontend components to display human-readable values

2. **src/pages/api/fetch-pnl.js**:
   - Has its own `decodeValue` function to decode position PnL values before summing

## The Problem

The encoding/decoding system adds unnecessary complexity:
1. **Double encoding/decoding**: Values are encoded in backend, then decoded in frontend
2. **Debugging difficulty**: Encoded integer values are harder to debug than decimals
3. **Code duplication**: Two separate `encodeValue`/`decodeValue` implementations
4. **Performance overhead**: Extra computation for encoding/decoding cycles

## Proposed Solution

### Step 1: Remove encoding from defituna.js
- Remove the `encodeValue` function definition
- Remove all `encodeValue()` calls in `processPositionsData()`
- Return raw decimal values directly

### Step 2: Remove encoding from fetch-pnl.js
- Remove the duplicate `encodeValue` function
- Remove encoding of `t_pnl` value
- Return raw decimal values

### Step 3: Simplify positionUtils.js
- Remove or simplify `decodePosition()` function since values won't be encoded
- Update to just map short API keys to descriptive keys without decoding

### Step 4: Update tests
- Update any tests that expect encoded values
- Remove test cases for encoding/decoding functions

## Implementation Plan

### Files to Modify:

1. **src/utils/defituna.js**:
   - Remove `encodeValue` function (lines 26-31)
   - Remove all `encodeValue()` calls in `processPositionsData()` (lines 294-336)
   - Return raw decimal values directly

2. **src/pages/api/fetch-pnl.js**:
   - Remove local `encodeValue` function (lines 8-13)
   - Remove local `decodeValue` function (lines 16-19)
   - Remove encoding of `t_pnl` (line 50)
   - Simplify total PnL calculation to work with raw decimals

3. **src/utils/positionUtils.js**:
   - Simplify `decodePosition()` to just map field names without decoding
   - Remove `decodeValue` import/usage

4. **Test files**:
   - Update `src/__tests__/utils/defituna.test.js`
   - Update `src/__tests__/pages/api/fetch-pnl.test.js`
   - Update `src/__tests__/utils/positionUtils.test.js`

## Benefits

1. **Simpler debugging**: Raw decimal values are easier to read in logs and debuggers
2. **Reduced complexity**: No need for encoding/decoding cycles
3. **Better performance**: Eliminates unnecessary computation
4. **Cleaner code**: Removes duplicate functions and complex mapping logic
5. **Easier maintenance**: Future developers won't need to understand the encoding system

## Risks and Mitigations

**Risk**: API response size might be slightly larger with decimals vs integers
**Mitigation**: Modern JSON compression and network speeds make this negligible

**Risk**: Breaking changes to API contract
**Mitigation**: This is an internal API, frontend can be updated simultaneously

**Risk**: Floating point precision issues
**Mitigation**: JavaScript handles decimal precision well for financial values at this scale

## Recommended Approach

Since this affects the API contract between backend and frontend, I recommend:
1. Implementing the changes in a single coordinated update
2. Testing thoroughly to ensure all frontend components work with raw decimals
3. Monitoring for any precision-related issues in production

The simplification will make the codebase much easier to maintain and debug.