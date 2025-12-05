/**
 * Debounce utility functions for throttling function calls.
 * This module provides both synchronous and asynchronous debounce functions
 * to improve application performance by limiting the rate of execution.
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 *
 * @param {Function} func The function to debounce
 * @param {number} wait The number of milliseconds to delay
 * @param {boolean} [immediate=false] Specify invoking on the leading edge of the timeout
 * @returns {Function} Returns the new debounced function
 * @throws {Error} If func is not a function or wait is not a positive number
 */
export function debounce(func, wait, immediate = false) {
  // Input validation
  if (typeof func !== 'function') {
    console.error('[debounce] First argument must be a function');
    throw new TypeError('Expected a function as first argument');
  }

  if (typeof wait !== 'number' || wait < 0) {
    console.error('[debounce] Wait time must be a positive number');
    throw new TypeError('Expected a positive number for wait time');
  }

  let timeout;

  return function(...args) {
    const context = this;

    const later = function() {
      timeout = null;
      if (!immediate) {func.apply(context, args);}
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {func.apply(context, args);}
  };
}

/**
 * Creates a debounced async function that returns a promise and delays invoking func
 * until after wait milliseconds have elapsed since the last time it was invoked.
 * Particularly useful for API calls.
 *
 * Features:
 * - Returns a Promise that resolves with the result of the async function
 * - Queues calls during debounce period to maintain execution order
 * - Preserves the original context ('this') in all calls
 * - Properly handles chain of Promise resolutions
 *
 * @param {Function} asyncFunc The async function to debounce
 * @param {number} wait The number of milliseconds to delay
 * @returns {Function} Returns a new debounced function that returns a promise
 * @throws {Error} If asyncFunc is not a function or wait is not a positive number
 */
export function debouncePromise(asyncFunc, wait) {
  // Input validation
  if (typeof asyncFunc !== 'function') {
    console.error('[debouncePromise] First argument must be a function');
    throw new TypeError('Expected a function as first argument');
  }

  if (typeof wait !== 'number' || wait < 0) {
    console.error('[debouncePromise] Wait time must be a positive number');
    throw new TypeError('Expected a positive number for wait time');
  }

  let timeout;
  let currentPromise = null;
  let queuedPromiseResolver = null;

  // Capture the function reference to avoid `this` issues in setTimeout
  let debouncedFunc = null;

  debouncedFunc = function(...args) {
    const self = this; // Preserve original context for asyncFunc call if needed

    try {
      // If we already have a current promise in flight and a new call comes in,
      // queue up a promise resolver for after the current call finishes
      if (currentPromise) {
        return new Promise(resolve => {
          // Save the latest arguments and resolver
          queuedPromiseResolver = { args, resolve };
        });
      }

      // If there's no current promise and no timeout, create a new promise
      if (!timeout) {
        currentPromise = asyncFunc.apply(this, args);

        // When the promise resolves, check if we have a queued request
        currentPromise.finally(() => {
          const queued = queuedPromiseResolver;
          currentPromise = null;
          queuedPromiseResolver = null;

          // If we have a queued request, process it after the debounce wait time
          if (queued) {
            timeout = setTimeout(() => {
              timeout = null;
              const { args, resolve } = queued;
              // Use the captured function reference for the recursive call
              resolve(debouncedFunc.apply(self, args)); // Use captured func and original context
            }, wait);
          }
        });

        return currentPromise;
      }

      // If we have a timeout but no current promise, clear it and set up a new one
      clearTimeout(timeout);

      return new Promise(resolve => {
        timeout = setTimeout(() => {
          timeout = null;
          try {
            currentPromise = asyncFunc.apply(this, args);
            resolve(currentPromise);

            // When current promise resolves, process any queued request
            currentPromise.finally(() => {
              const queued = queuedPromiseResolver;
              currentPromise = null;
              queuedPromiseResolver = null;

              if (queued) {
                timeout = setTimeout(() => {
                  timeout = null;
                  const { args, resolve } = queued;
                  // Use the captured function reference for the recursive call
                  resolve(debouncedFunc.apply(self, args)); // Use captured func and original context
                }, wait);
              }
            });
          } catch (error) {
            console.error('[debouncePromise] Error in debounced function:', error);
            resolve(Promise.reject(error));
          }
        }, wait);
      });
    } catch (error) {
      console.error('[debouncePromise] Unexpected error:', error);
      return Promise.reject(error);
    }
  };

  return debouncedFunc; // Return the captured function reference
}