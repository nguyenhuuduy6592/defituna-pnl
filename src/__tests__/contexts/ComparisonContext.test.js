import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { ComparisonProvider, useComparison } from '../../contexts/ComparisonContext';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    getAll: () => store,
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('provides initial empty comparison pools state', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );
    
    // Should start with zero pools
    expect(screen.getByTestId('pools-count')).toHaveTextContent('0');
    expect(screen.getByTestId('pool1-in-comparison')).toHaveTextContent('No');
  });

  it('adds pools to comparison', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );
    
    // Add first pool
    act(() => {
      screen.getByTestId('add-pool1').click();
    });
    
    // Should have one pool now
    expect(screen.getByTestId('pools-count')).toHaveTextContent('1');
    expect(screen.getByTestId('pool1-in-comparison')).toHaveTextContent('Yes');
    expect(screen.getByTestId('pool-pool1')).toHaveTextContent('ETH/USDT');
    
    // Add second pool
    act(() => {
      screen.getByTestId('add-pool2').click();
    });
    
    // Should have two pools now
    expect(screen.getByTestId('pools-count')).toHaveTextContent('2');
    expect(screen.getByTestId('pool-pool2')).toHaveTextContent('BTC/USDT');
  });

  it('prevents adding duplicate pools', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );
    
    // Add pool1 twice
    act(() => {
      screen.getByTestId('add-pool1').click();
      screen.getByTestId('add-pool1').click();
    });
    
    // Should still have only one pool
    expect(screen.getByTestId('pools-count')).toHaveTextContent('1');
  });

  it('enforces maximum number of comparison pools', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );
    
    // Check max pools value is correct
    expect(screen.getByTestId('max-pools')).toHaveTextContent('3');
    
    // Add four pools
    act(() => {
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

  it('removes pools from comparison', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );
    
    // Add two pools
    act(() => {
      screen.getByTestId('add-pool1').click();
      screen.getByTestId('add-pool2').click();
    });
    
    // Should have two pools
    expect(screen.getByTestId('pools-count')).toHaveTextContent('2');
    
    // Remove first pool
    act(() => {
      screen.getByTestId('remove-pool1').click();
    });
    
    // Should have one pool left
    expect(screen.getByTestId('pools-count')).toHaveTextContent('1');
    expect(screen.queryByTestId('pool-pool1')).not.toBeInTheDocument();
    expect(screen.getByTestId('pool-pool2')).toBeInTheDocument();
    
    // The context should report pool1 is no longer in comparison
    expect(screen.getByTestId('pool1-in-comparison')).toHaveTextContent('No');
  });

  it('clears all pools from comparison', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );
    
    // Add three pools
    act(() => {
      screen.getByTestId('add-pool1').click();
      screen.getByTestId('add-pool2').click();
      screen.getByTestId('add-pool3').click();
    });
    
    // Should have three pools
    expect(screen.getByTestId('pools-count')).toHaveTextContent('3');
    
    // Clear all pools
    act(() => {
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

  it('persists comparison pools to localStorage', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );
    
    // Add two pools
    act(() => {
      screen.getByTestId('add-pool1').click();
      screen.getByTestId('add-pool2').click();
    });
    
    // localStorage.setItem should have been called
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'comparisonPools',
      expect.any(String)
    );
    
    // Access the localStorage store directly
    const storedValue = localStorage.getItem('comparisonPools');
    expect(storedValue).toBeTruthy();
    
    // The value stored should be a serialized array with our two pools
    const savedValue = JSON.parse(storedValue);
    expect(savedValue).toHaveLength(2);
    expect(savedValue[0].address).toBe('pool1');
    expect(savedValue[1].address).toBe('pool2');
  });

  it('loads comparison pools from localStorage on mount', () => {
    // Set initial localStorage value
    const initialPools = [
      { address: 'pool2', name: 'BTC/USDT' },
      { address: 'pool3', name: 'DOT/USDT' }
    ];
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(initialPools));
    
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );
    
    // Should have loaded two pools
    expect(screen.getByTestId('pools-count')).toHaveTextContent('2');
    expect(screen.getByTestId('pool-pool2')).toHaveTextContent('BTC/USDT');
    expect(screen.getByTestId('pool-pool3')).toHaveTextContent('DOT/USDT');
    
    // localStorage.getItem should have been called
    expect(localStorage.getItem).toHaveBeenCalledWith('comparisonPools');
  });

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage.getItem to throw an error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    localStorage.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage is not available');
    });
    
    // Component should render without errors
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );
    
    // Should have logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error loading saved comparison pools:',
      expect.any(Error)
    );
    
    // Should still render with empty state
    expect(screen.getByTestId('pools-count')).toHaveTextContent('0');
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('handles localStorage setItem errors gracefully', () => {
    // Mock localStorage.setItem to throw an error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage is not available');
    });
    
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );
    
    // Add a pool to trigger localStorage.setItem
    act(() => {
      screen.getByTestId('add-pool1').click();
    });
    
    // Should have logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error saving comparison pools:',
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