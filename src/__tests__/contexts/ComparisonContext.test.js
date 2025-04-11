import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { ComparisonProvider, useComparison } from '@/contexts/ComparisonContext';
// Import the actual functions - they are mocked by jest.setup.js
import { getData, saveData } from '@/utils/indexedDB'; 

// Test component that uses the context
const TestComponent = () => {
  const { 
    comparisonPools, 
    addPoolToComparison, 
    removePoolFromComparison, 
    clearComparison, 
    isInComparison,
    maxPools
  } = useComparison();
  
  return (
    <div>
      <h1 data-testid="pools-count">{comparisonPools.length}</h1>
      <ul>
        {comparisonPools.map((pool) => (
          <li key={pool.address} data-testid={`pool-${pool.address}`}>
            {pool.name}
            <button 
              onClick={() => removePoolFromComparison(pool.address)}
              data-testid={`remove-${pool.address}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button 
        onClick={() => addPoolToComparison({ address: 'pool1', name: 'ETH/USDT' })}
        data-testid="add-pool1"
      >
        Add Pool 1
      </button>
      <button 
        onClick={() => addPoolToComparison({ address: 'pool2', name: 'BTC/USDT' })}
        data-testid="add-pool2"
      >
        Add Pool 2
      </button>
      <button 
        onClick={() => addPoolToComparison({ address: 'pool3', name: 'DOT/USDT' })}
        data-testid="add-pool3"
      >
        Add Pool 3
      </button>
      <button 
        onClick={() => addPoolToComparison({ address: 'pool4', name: 'LINK/USDT' })}
        data-testid="add-pool4"
      >
        Add Pool 4
      </button>
      <button 
        onClick={clearComparison}
        data-testid="clear-pools"
      >
        Clear All
      </button>
      <div data-testid="max-pools">{maxPools}</div>
      <div data-testid="pool1-in-comparison">
        {isInComparison('pool1') ? 'Yes' : 'No'}
      </div>
    </div>
  );
};

describe('ComparisonContext', () => {
  it('provides initial empty comparison pools state', async () => {
    await act(async () => {
      render(
        <ComparisonProvider>
          <TestComponent />
        </ComparisonProvider>
      );
    });
    
    // Should start with zero pools
    expect(screen.getByTestId('pools-count')).toHaveTextContent('0');
    expect(screen.getByTestId('pool1-in-comparison')).toHaveTextContent('No');
  });

  it('adds pools to comparison', async () => {
    await act(async () => {
      render(
        <ComparisonProvider>
          <TestComponent />
        </ComparisonProvider>
      );
    });
    
    // Add first pool
    await act(async () => {
      screen.getByTestId('add-pool1').click();
    });
    
    // Should have one pool now
    expect(screen.getByTestId('pools-count')).toHaveTextContent('1');
    expect(screen.getByTestId('pool1-in-comparison')).toHaveTextContent('Yes');
    expect(screen.getByTestId('pool-pool1')).toHaveTextContent('ETH/USDT');
    
    // Add second pool
    await act(async () => {
      screen.getByTestId('add-pool2').click();
    });
    
    // Should have two pools now
    expect(screen.getByTestId('pools-count')).toHaveTextContent('2');
    expect(screen.getByTestId('pool-pool2')).toHaveTextContent('BTC/USDT');
  });

  it('prevents adding duplicate pools', async () => {
    await act(async () => {
      render(
        <ComparisonProvider>
          <TestComponent />
        </ComparisonProvider>
      );
    });
    
    // Add pool1 twice
    await act(async () => {
      screen.getByTestId('add-pool1').click();
      screen.getByTestId('add-pool1').click();
    });
    
    // Should still have only one pool
    expect(screen.getByTestId('pools-count')).toHaveTextContent('1');
  });

  it('enforces maximum number of comparison pools', async () => {
    await act(async () => {
      render(
        <ComparisonProvider>
          <TestComponent />
        </ComparisonProvider>
      );
    });
    
    // Check max pools value is correct
    expect(screen.getByTestId('max-pools')).toHaveTextContent('3');
    
    // Add four pools
    await act(async () => {
      screen.getByTestId('add-pool1').click();
      screen.getByTestId('add-pool2').click();
      screen.getByTestId('add-pool3').click();
      screen.getByTestId('add-pool4').click(); // This should replace pool1
    });
    
    // Should still have three pools (MAX_COMPARISON_POOLS)
    expect(screen.getByTestId('pools-count')).toHaveTextContent('3');
    
    // pool1 should be replaced by pool4 (FIFO)
    expect(screen.queryByTestId('pool-pool1')).not.toBeInTheDocument();
    expect(screen.getByTestId('pool-pool4')).toBeInTheDocument();
    
    // The context should report pool1 is no longer in comparison
    expect(screen.getByTestId('pool1-in-comparison')).toHaveTextContent('No');
  });

  it('removes pools from comparison', async () => {
    await act(async () => {
      render(
        <ComparisonProvider>
          <TestComponent />
        </ComparisonProvider>
      );
    });
    
    // Add two pools
    await act(async () => {
      screen.getByTestId('add-pool1').click();
      screen.getByTestId('add-pool2').click();
    });
    
    // Should have two pools
    expect(screen.getByTestId('pools-count')).toHaveTextContent('2');
    
    // Remove first pool
    await act(async () => {
      screen.getByTestId('remove-pool1').click();
    });
    
    // Should have one pool left
    expect(screen.getByTestId('pools-count')).toHaveTextContent('1');
    expect(screen.queryByTestId('pool-pool1')).not.toBeInTheDocument();
    expect(screen.getByTestId('pool-pool2')).toBeInTheDocument();
    
    // The context should report pool1 is no longer in comparison
    expect(screen.getByTestId('pool1-in-comparison')).toHaveTextContent('No');
  });

  it('clears all pools from comparison', async () => {
    await act(async () => {
      render(
        <ComparisonProvider>
          <TestComponent />
        </ComparisonProvider>
      );
    });
    
    // Add three pools
    await act(async () => {
      screen.getByTestId('add-pool1').click();
      screen.getByTestId('add-pool2').click();
      screen.getByTestId('add-pool3').click();
    });
    
    // Should have three pools
    expect(screen.getByTestId('pools-count')).toHaveTextContent('3');
    
    // Clear all pools
    await act(async () => {
      screen.getByTestId('clear-pools').click();
    });
    
    // Should have zero pools
    expect(screen.getByTestId('pools-count')).toHaveTextContent('0');
    expect(screen.queryByTestId('pool-pool1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pool-pool2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pool-pool3')).not.toBeInTheDocument();
    
    // The context should report no pools are in comparison
    expect(screen.getByTestId('pool1-in-comparison')).toHaveTextContent('No');
  });

  it('loads comparison pools from IndexedDB on mount', async () => {
    // Set initial IndexedDB value
    const initialPools = [
      { address: 'pool2', name: 'BTC/USDT' },
      { address: 'pool3', name: 'DOT/USDT' }
    ];
    // Use the imported (mocked) getData function
    getData.mockImplementationOnce((db, storeName, key) => {
      if (key === 'comparisonPools') {
        return Promise.resolve({ value: initialPools });
      }
      return Promise.resolve(null);
    });
    
    await act(async () => {
      render(
        <ComparisonProvider>
          <TestComponent />
        </ComparisonProvider>
      );
    });
    
    // Should have loaded two pools
    expect(screen.getByTestId('pools-count')).toHaveTextContent('2');
    expect(screen.getByTestId('pool-pool2')).toHaveTextContent('BTC/USDT');
    expect(screen.getByTestId('pool-pool3')).toHaveTextContent('DOT/USDT');
  });

  it('handles IndexedDB errors gracefully', async () => {
    // Mock getData to throw an error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    // Use the imported (mocked) getData function
    getData.mockImplementationOnce(() => {
      throw new Error('IndexedDB is not available');
    });
    
    await act(async () => {
      render(
        <ComparisonProvider>
          <TestComponent />
        </ComparisonProvider>
      );
    });
    
    // Should have logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error loading comparison pools from IndexedDB:',
      expect.any(Error)
    );
    
    // Should still render with empty state
    expect(screen.getByTestId('pools-count')).toHaveTextContent('0');
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('handles IndexedDB saveData errors gracefully', async () => {
    // Mock saveData to throw an error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    // Use the imported (mocked) saveData function
    saveData.mockImplementationOnce(() => {
      throw new Error('IndexedDB is not available');
    });
    
    await act(async () => {
      render(
        <ComparisonProvider>
          <TestComponent />
        </ComparisonProvider>
      );
    });
    
    // Add a pool to trigger saveData
    await act(async () => {
      screen.getByTestId('add-pool1').click();
    });
    
    // Should have logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error saving comparison pools to IndexedDB:',
      expect.any(Error)
    );
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('throws error when useComparison is used outside provider', () => {
    // Suppress console.error for this test as we expect an error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      renderHook(() => useComparison());
    }).toThrow('useComparison must be used within a ComparisonProvider');
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
}); 