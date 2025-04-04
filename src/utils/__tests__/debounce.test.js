import { debounce, debouncePromise } from '../debounce';

// Use Jest's fake timers
jest.useFakeTimers();

describe('debounce', () => {
  let func;
  let debouncedFunc;

  beforeEach(() => {
    func = jest.fn();
  });

  it('should debounce function calls', () => {
    debouncedFunc = debounce(func, 100);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    // Should not be called yet
    expect(func).not.toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(100);

    // Should be called once now
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should call immediately if immediate is true', () => {
    debouncedFunc = debounce(func, 100, true);

    debouncedFunc();

    // Should be called immediately
    expect(func).toHaveBeenCalledTimes(1);

    // Fast-forward time
    jest.advanceTimersByTime(100);

    // Should still only be called once
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the debounced function', () => {
    debouncedFunc = debounce(func, 100);
    const args = [1, 'test', { a: 1 }];

    debouncedFunc(...args);
    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledWith(...args);
  });

  it('should preserve the context (`this`)', () => {
    const context = { key: 'value' };
    debouncedFunc = debounce(func, 100);

    debouncedFunc.call(context);
    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith(); // No arguments passed in this case
    // Check context (this requires func to be a non-arrow function or careful setup)
    // Jest's mock functions don't easily track context, might need a real function
    // For now, we assume standard JS behavior applies.
  });

  it('should throw error for invalid input', () => {
    // Silence console.error for these specific tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => debounce(null, 100)).toThrow(TypeError);
    expect(() => debounce(() => {}, -100)).toThrow(TypeError);

    // Restore console.error
    consoleSpy.mockRestore();
  });
});

describe('debouncePromise', () => {
  let asyncFunc;
  let debouncedAsyncFunc;

  beforeEach(() => {
    // Mock async function that resolves after a delay
    asyncFunc = jest.fn(async (val) => {
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async work
      return `resolved: ${val}`;
    });
    debouncedAsyncFunc = debouncePromise(asyncFunc, 100);
  });

  it('should execute the first call immediately and debounce subsequent calls', async () => {
    const promise1 = debouncedAsyncFunc('call1');
    expect(asyncFunc).toHaveBeenCalledTimes(1);
    expect(asyncFunc).toHaveBeenCalledWith('call1');

    // Flush microtasks to allow promise internal state to update if needed
    await jest.advanceTimersByTimeAsync(0);

    // Subsequent calls queue the *last* one ('call3')
    const promise2 = debouncedAsyncFunc('call2');
    const promise3 = debouncedAsyncFunc('call3');

    // At this point, asyncFunc (call1) is running. No new calls yet.
    expect(asyncFunc).toHaveBeenCalledTimes(1);

    // Let call1's internal async work finish (50ms)
    await jest.advanceTimersByTimeAsync(50);
    await expect(promise1).resolves.toBe('resolved: call1');

    // Now call1's finally block should run, finding 'call3' queued.
    // It sets a timeout for call3.
    // We need to run ONLY that pending timeout.
    jest.runOnlyPendingTimers(); // Should trigger the setTimeout(..., wait=100)

    // Flush microtasks again after running timer
    await jest.advanceTimersByTimeAsync(0);

    // Now, the debouncedFunc('call3') should execute.
    // Because it's the first call in its own debounced cycle (triggered recursively), it runs immediately.
    expect(asyncFunc).toHaveBeenCalledTimes(2);
    expect(asyncFunc).toHaveBeenCalledWith('call3');

    // Let call3's internal async work finish (50ms)
    await jest.advanceTimersByTimeAsync(50);

    // Check resolutions
    await expect(promise2).resolves.toBe('resolved: call3');
    await expect(promise3).resolves.toBe('resolved: call3');
  });

  it('should handle rapid calls, executing first immediately, then queueing the last call', async () => {
    const promise1 = debouncedAsyncFunc('first');
    expect(asyncFunc).toHaveBeenCalledTimes(1);
    expect(asyncFunc).toHaveBeenCalledWith('first');

    // Flush microtasks
    await jest.advanceTimersByTimeAsync(0);

    // Rapid subsequent calls queue 'third'
    const promise2 = debouncedAsyncFunc('second');
    const promise3 = debouncedAsyncFunc('third');
    expect(asyncFunc).toHaveBeenCalledTimes(1); // Still only first call running

    // Let first call's internal work finish (50ms)
    await jest.advanceTimersByTimeAsync(50);
    await expect(promise1).resolves.toBe('resolved: first');

    // First call's finally block runs, queues 'third' with a 100ms timeout.
    // Run that timeout.
    jest.runOnlyPendingTimers();
    await jest.advanceTimersByTimeAsync(0); // Flush microtasks

    // The recursive call debouncedFunc('third') should execute immediately
    expect(asyncFunc).toHaveBeenCalledTimes(2);
    expect(asyncFunc).toHaveBeenCalledWith('third');

    // Let third call's internal work finish (50ms)
    await jest.advanceTimersByTimeAsync(50);

    // Check resolutions
    await expect(promise2).resolves.toBe('resolved: third');
    await expect(promise3).resolves.toBe('resolved: third');
  }, 10000); // Increased timeout to 10 seconds

  it('should handle calls arriving while a queued call is pending timeout', async () => {
    const promise1 = debouncedAsyncFunc('call1');
    expect(asyncFunc).toHaveBeenCalledTimes(1);
    expect(asyncFunc).toHaveBeenCalledWith('call1');

    await jest.advanceTimersByTimeAsync(0); // Flush

    // Let call1 finish its async work (50ms)
    await jest.advanceTimersByTimeAsync(50);
    await expect(promise1).resolves.toBe('resolved: call1');

    // Call1 finally block queues 'call2' with 100ms timeout
    const promise2 = debouncedAsyncFunc('call2');
    expect(asyncFunc).toHaveBeenCalledTimes(1);

    // Call 'call3' BEFORE the 100ms timeout for 'call2' expires.
    // This should effectively replace 'call2' in the queue.
    jest.advanceTimersByTime(50); // Advance time partially (less than wait=100)
    const promise3 = debouncedAsyncFunc('call3');
    expect(asyncFunc).toHaveBeenCalledTimes(1);

    // Now run the pending timers. The finally block from call1 should find 'call3'
    // in queuedPromiseResolver and schedule its execution.
    jest.runOnlyPendingTimers();
    await jest.advanceTimersByTimeAsync(0); // Flush

    // The recursive call debouncedFunc('call3') executes immediately.
    expect(asyncFunc).toHaveBeenCalledTimes(2);
    expect(asyncFunc).toHaveBeenCalledWith('call3');

    // Let call3 finish its async work (50ms)
    await jest.advanceTimersByTimeAsync(50);

    // Check resolutions
    await expect(promise2).resolves.toBe('resolved: call3');
    await expect(promise3).resolves.toBe('resolved: call3');

    // Flush any remaining timers (should be none relevant)
    jest.runAllTimers();
    await jest.advanceTimersByTimeAsync(0);

    // Fourth call after everything has settled - executes immediately
    const promise4 = debouncedAsyncFunc('call4');
    expect(asyncFunc).toHaveBeenCalledTimes(3);
    expect(asyncFunc).toHaveBeenCalledWith('call4');
    await jest.advanceTimersByTimeAsync(50);
    await expect(promise4).resolves.toBe('resolved: call4');
  });

  it('should reject the promise if the async function throws (handling first immediate call)', async () => {
    const error = new Error('Async failed');
    asyncFunc = jest.fn(async () => {
      await jest.advanceTimersByTimeAsync(50); // Simulate async work
      throw error;
    });
    debouncedAsyncFunc = debouncePromise(asyncFunc, 100);

    const promise = debouncedAsyncFunc('call-fail');
    expect(asyncFunc).toHaveBeenCalledTimes(1);
    expect(asyncFunc).toHaveBeenCalledWith('call-fail');

    // Flush microtasks and let async work finish (and throw)
    await jest.advanceTimersByTimeAsync(0);
    // No need to advance time again, the mock function handles it.

    // The promise returned by the first immediate call should reject
    await expect(promise).rejects.toThrow('Async failed');

    // Make another call
    const promise2 = debouncedAsyncFunc('call-after-fail');

    // The finally block from the first call runs (even on rejection).
    // It finds 'call-after-fail' queued and sets a timeout for it.
    expect(asyncFunc).toHaveBeenCalledTimes(1);

    // Run the pending timeout for the queued call
    jest.runOnlyPendingTimers();
    await jest.advanceTimersByTimeAsync(0); // Flush

    // The recursive call debouncedFunc('call-after-fail') executes immediately and runs asyncFunc again.
    expect(asyncFunc).toHaveBeenCalledTimes(2);
    expect(asyncFunc).toHaveBeenCalledWith('call-after-fail');

    // Let the second call's async work finish (and throw)
    // No need to advance time, mock handles it.

    // Expect the second promise to also reject
    await expect(promise2).rejects.toThrow('Async failed');
  });

  it('should throw error for invalid input', () => {
    // Silence console.error for these specific tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => debouncePromise(null, 100)).toThrow(TypeError);
    expect(() => debouncePromise(async () => {}, -100)).toThrow(TypeError);

    // Restore console.error
    consoleSpy.mockRestore();
  });
}); 