# Migration Plan: localStorage to IndexedDB (Refined)

## Progress Tracker

| Step | Description                       | Status      |
| :--- | :-------------------------------- | :---------- |
| 1    | Assess localStorage Usage         | Completed   |
| 2    | Enhance IndexedDB Utility         | Completed   |
| 3    | Implement One-Time Data Migration | Completed   |
| 4    | Update Application Logic          | Completed   |
| 5    | Testing and Validation            | In Progress |
| 6    | Deployment and Monitoring         | Not Started |
| 7    | Post-Migration Cleanup          | Not Started |

## Objective
Transition all data storage from `localStorage` to IndexedDB to leverage better performance, larger storage capacity, and improved data management capabilities. Implement with minimal code changes to existing hooks and components, ensuring functionality through updated unit tests.

## Step 1: Assessment of Current localStorage Usage
- **Target `localStorage` Keys**: Identify all instances where `localStorage.getItem`, `localStorage.setItem`, and `localStorage.removeItem` are used. The primary keys identified are:
  - `comparisonPools` (in `src/contexts/ComparisonContext.js`)
  - `poolSavedFilters` (in `src/components/pools/PoolFilters.js`)
  - `savedWallets`, `activeWallets`, `primaryWallet` (in `src/hooks/useWallet.js`)
  - `autoRefresh`, `refreshInterval` (in `src/hooks/useAutoRefresh.js` - *verify if this persists or is session-based*)
  - `invertedPairs` (in `src/hooks/useInvertedPairs.js`)
  - `disclaimerShown` (in `src/pages/index.js`)
- **Goal**: Replace direct `localStorage` API calls with asynchronous calls to a new IndexedDB utility module.

## Step 2: Enhance IndexedDB Utility (`src/utils/indexedDB.js`)
- **Define New Object Stores**: Create the following object stores within the existing `defituna-pnl` IndexedDB database (increment `DB_VERSION` if necessary):
  - `settings`: For simple key-value settings (e.g., `disclaimerShown`, `autoRefresh`, `refreshInterval`). `keyPath: 'key'`.
  - `comparisonPools`: To store the array of comparison pools. Use a fixed key (e.g., `'currentComparison'`). `keyPath: 'key'`.
  - `savedFilters`: To store saved pool filter configurations. `keyPath: 'id'` (as currently used in `PoolFilters.js`).
  - `wallets`: To store wallet-related data (e.g., saved wallets array, active wallets array, primary wallet). Use fixed keys like `'savedWallets'`, `'activeWallets'`, `'primaryWallet'`. `keyPath: 'key'`.
  - `invertedPairs`: To store the set (as an array) of inverted pairs. Use a fixed key (e.g., `'currentInvertedPairs'`). `keyPath: 'key'`.
- **Implement Generic Accessor Functions**: Add the following asynchronous utility functions to `src/utils/indexedDB.js`:
  - `initializeDB()`: Ensure this handles the creation/upgrade of *all* required stores.
  - `saveData(db, storeName, data)`: Generic function to add/update data (using `put`). Expects `data` to be an object matching the store's structure (e.g., `{ key: 'someKey', value: 'someValue' }` or `{ id: 123, filterData: {...} }`).
  - `getData(db, storeName, key)`: Generic function to retrieve data by its key.
  - `getAllData(db, storeName)`: Generic function to retrieve all items from a store (useful for `savedFilters`).
  - `deleteData(db, storeName, key)`: Generic function to delete data by its key.
  - `clearStore(db, storeName)`: Generic function to clear all data from a store.
- **Database Instance Management**: Ensure a single database instance (`db`) is initialized and passed around or managed centrally (perhaps via a context or the existing `useHistoricalData` hook if appropriate).

## Step 3: Implement One-Time Data Migration
- **Migration Logic Location**: Implement the migration logic within a high-level component or context provider that initializes early in the app lifecycle (e.g., `_app.js` or a dedicated `AppInitializer` component/context).
- **Migration Trigger**: Use a check within the migration logic:
  1. Initialize the IndexedDB (`initializeDB`).
  2. Attempt to read a migration flag from the `settings` store: `await getData(db, 'settings', 'localStorageMigrated')`.
  3. If the flag is *not* found:
     - Read data for each key identified in Step 1 from `localStorage`.
     - Parse/transform data if necessary (e.g., `JSON.parse`). Handle potential parsing errors.
     - Use the `saveData` utility function to write the data to the corresponding IndexedDB store and key (e.g., `await saveData(db, 'settings', { key: 'disclaimerShown', value: localStorage.getItem('disclaimerShown') })`).
     - After successfully migrating all keys, set the migration flag: `await saveData(db, 'settings', { key: 'localStorageMigrated', value: true })`.
- **Error Handling**: Wrap the migration logic in try/catch blocks. If migration fails, log the error but allow the app to continue (it might operate without migrated data initially).
- **Fallback**: Do *not* clear `localStorage` during this step. Retain it as a temporary fallback (see Step 7).

## Step 4: Update Application Logic (Minimal Change Principle)
- **Target Files**: Refactor the following files identified in Step 1:
  - `src/contexts/ComparisonContext.js`
  - `src/hooks/useAutoRefresh.js`
  - `src/hooks/useWallet.js`
  - `src/components/pools/PoolFilters.js`
  - `src/hooks/useInvertedPairs.js`
  - `src/pages/index.js`
- **Refactoring Strategy**: 
  - Replace `localStorage.getItem('someKey')` with `await getData(db, storeName, 'someKey')`. Handle the returned value (which might be an object like `{ key: 'someKey', value: ... }` or the direct value if the key is the primary key).
  - Replace `localStorage.setItem('someKey', JSON.stringify(value))` with `await saveData(db, storeName, { key: 'someKey', value: value })` or `await saveData(db, storeName, itemObject)` depending on the store structure.
  - Replace `localStorage.removeItem('someKey')` with `await deleteData(db, storeName, 'someKey')`.
  - **Asynchronous Operations**: Modify the hooks and components to handle the asynchronous nature of IndexedDB. Use `async/await` within `useEffect` hooks for initial data loading and within callback functions (like event handlers) for saving/deleting data. Manage loading states appropriately.
  - **Example (`useWallet.js` loading saved wallets):**
    ```javascript
    useEffect(() => {
      const loadWallets = async () => {
        const saved = await getData(db, 'wallets', 'savedWallets');
        if (saved && saved.value) {
          setSavedWallets(saved.value);
        }
        // ... load active wallets, primary wallet ...
      };
      if (db) { // Ensure DB is initialized
        loadWallets();
      }
    }, [db]); // Dependency on the db instance
    ```

## Step 5: Testing and Validation
- **Update Unit Tests**: 
  - Identify unit tests covering the hooks and components modified in Step 4.
  - Mock the new IndexedDB utility functions (`getData`, `saveData`, etc.) from `src/utils/indexedDB.js`. Ensure mocks return realistic asynchronous responses (e.g., `Promise.resolve(...)`).
  - Remove mocks related to `localStorage` (`jest.spyOn(Storage.prototype, 'getItem')`, etc.).
  - Verify that components correctly handle loading states introduced by asynchronous operations.
  - Add tests for the data migration logic (mocking both `localStorage` and the IndexedDB utilities).
- **Manual Testing**: 
  - Thoroughly test all application features that relied on `localStorage`.
  - Verify data persistence across page refreshes and browser sessions.
  - Test the migration process using browser developer tools (clear IndexedDB, run the app, check if data appears in IndexedDB).
- **Performance**: Observe initial load times and interaction responsiveness, comparing them (subjectively or via profiling) to the `localStorage` version.

## Step 6: Deployment and Monitoring
- **Phased Rollout (Optional)**: Consider using a feature flag initially to enable the IndexedDB logic for a subset of users or internal testers.
- **Monitoring**: Monitor console logs and any integrated error tracking for IndexedDB-related errors (`Failed to initialize...`, `Failed to save data...`, etc.) post-deployment.

## Step 7: Post-Migration Cleanup
- **Stabilization Period**: After the migration has been deployed and confirmed stable for a reasonable period (e.g., a few weeks), proceed with cleanup.
- **Remove Migration Code**: Remove the one-time migration script logic (checking the `localStorageMigrated` flag and reading from `localStorage`) from the initializer component/context.
- **Remove Fallback `localStorage` Calls (Optional but Recommended)**: If any fallback logic reading from `localStorage` was implemented, remove it.
- **Code Simplification**: Remove any remaining unused `localStorage` variables or imports.
- **Clear Old `localStorage` Data (Optional)**: Consider adding a small utility (run once or manually triggered) to iterate through the known `localStorage` keys and remove them, cleaning up users' browsers. This is low priority.
