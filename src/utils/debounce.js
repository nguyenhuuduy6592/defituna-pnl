/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 * 
 * @param {Function} func The function to debounce
 * @param {number} wait The number of milliseconds to delay
 * @param {boolean} [immediate=false] Specify invoking on the leading edge of the timeout
 * @returns {Function} Returns the new debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  
  return function(...args) {
    const context = this;
    
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Creates a debounced async function that returns a promise and delays invoking func
 * until after wait milliseconds have elapsed since the last time it was invoked.
 * Particularly useful for API calls.
 * 
 * @param {Function} asyncFunc The async function to debounce
 * @param {number} wait The number of milliseconds to delay
 * @returns {Function} Returns a new debounced function that returns a promise
 */
export function debouncePromise(asyncFunc, wait) {
  let timeout;
  let currentPromise = null;
  let queuedPromiseResolver = null;
  
  return function(...args) {
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
            resolve(this(...args)); // Recursive call with saved args
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
              resolve(this(...args));
            }, wait);
          }
        });
      }, wait);
    });
  };
} 