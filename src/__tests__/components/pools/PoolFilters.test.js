import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PoolFilters from '../../../components/pools/PoolFilters';

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock TimeframeSelector since it's a UI component we can test separately
jest.mock('../../../components/common/TimeframeSelector', () => {
  return jest.fn(({ timeframes, selected, onChange }) => (
    <div data-testid="timeframe-selector">
      {timeframes.map(timeframe => (
        <button 
          key={timeframe} 
          data-testid={`timeframe-${timeframe}`}
          className={selected === timeframe ? 'active' : ''}
          onClick={() => onChange(timeframe)}
        >
          {timeframe}
        </button>
      ))}
    </div>
  ));
});

describe('PoolFilters Component', () => {
  const defaultFilters = {
    sortBy: 'tvl',
    sortOrder: 'desc',
    token: '',
    minTvl: 0,
    timeframe: '24h'
  };
  
  const filterOptions = {
    tokens: ['ETH', 'USDC', 'DAI'],
    tvlRanges: [
      { value: 0, label: 'Any TVL' },
      { value: 10000, label: '$10K+' },
      { value: 100000, label: '$100K+' }
    ]
  };
  
  const mockOnFilterChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  test('renders all filter controls correctly', () => {
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    // Check for timeframe selector
    expect(screen.getByTestId('timeframe-selector')).toBeInTheDocument();
    
    // Check for sort selector
    const sortSelector = screen.getAllByRole('combobox')[0];
    expect(sortSelector).toBeInTheDocument();
    expect(screen.getByText('TVL (High to Low)')).toBeInTheDocument();
    
    // Check for token filter
    const tokenSelector = screen.getAllByRole('combobox')[1];
    expect(tokenSelector).toBeInTheDocument();
    expect(screen.getByText('All Tokens')).toBeInTheDocument();
    
    // Check for TVL filter
    const tvlSelector = screen.getAllByRole('combobox')[2];
    expect(tvlSelector).toBeInTheDocument();
    expect(screen.getByText('Any TVL')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
  
  test('loads filters from localStorage on mount', () => {
    const savedFilters = {
      sortBy: 'volume24h',
      sortOrder: 'asc',
      token: 'ETH',
      minTvl: 10000,
      timeframe: '7d'
    };
    
    localStorage.getItem.mockReturnValueOnce(null); // savedFilters
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(savedFilters)); // poolFilters
    
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    expect(mockOnFilterChange).toHaveBeenCalledWith(savedFilters);
  });
  
  test('handles sort change correctly', () => {
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    const sortSelector = screen.getAllByRole('combobox')[0];
    fireEvent.change(sortSelector, { target: { value: 'volume24h:desc' } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      sortBy: 'volume24h',
      sortOrder: 'desc'
    });
  });
  
  test('handles token filter change correctly', () => {
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    const tokenSelector = screen.getAllByRole('combobox')[1];
    fireEvent.change(tokenSelector, { target: { value: 'ETH' } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      token: 'ETH'
    });
  });
  
  test('handles TVL filter change correctly', () => {
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    const tvlSelector = screen.getAllByRole('combobox')[2];
    fireEvent.change(tvlSelector, { target: { value: '10000' } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      minTvl: 10000
    });
  });
  
  test('handles timeframe change correctly', () => {
    render(
      <PoolFilters 
        filters={{
          ...defaultFilters,
          sortBy: 'volume24h',
        }} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    // Simulate timeframe button click
    fireEvent.click(screen.getByTestId('timeframe-7d'));
    
    // It should update the timeframe and also update sortBy with new timeframe
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      sortBy: 'volume7d',
      timeframe: '7d'
    });
  });
  
  test('handles reset filters correctly', () => {
    const customFilters = {
      sortBy: 'volume24h',
      sortOrder: 'asc',
      token: 'ETH',
      minTvl: 10000,
      timeframe: '7d'
    };
    
    render(
      <PoolFilters 
        filters={customFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith(defaultFilters);
  });
  
  test('saves filter correctly', async () => {
    const customFilters = {
      sortBy: 'volume24h',
      sortOrder: 'asc',
      token: 'ETH',
      minTvl: 10000,
      timeframe: '7d'
    };
    
    jest.spyOn(Date, 'now').mockImplementation(() => 12345);
    
    render(
      <PoolFilters 
        filters={customFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'poolSavedFilters',
        expect.stringContaining('"id":12345')
      );
    });
    
    const savedFiltersJson = JSON.parse(localStorage.setItem.mock.calls.find(
      call => call[0] === 'poolSavedFilters'
    )[1]);
    
    expect(savedFiltersJson[0].filters).toEqual(customFilters);
    expect(savedFiltersJson[0].label).toContain('Volume (Low to High)');
    expect(savedFiltersJson[0].label).toContain('Time: 7d');
    expect(savedFiltersJson[0].label).toContain('Token: ETH');
    expect(savedFiltersJson[0].label).toContain('Min TVL: $10K+');
  });
  
  test('renders and applies saved filters', async () => {
    const savedFiltersData = [{
      id: 12345,
      label: 'Volume (Low to High) | Time: 7d | Token: ETH | Min TVL: $10K+',
      filters: {
        sortBy: 'volume7d',
        sortOrder: 'asc',
        token: 'ETH',
        minTvl: 10000,
        timeframe: '7d'
      }
    }];
    
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(savedFiltersData));
    
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    // Check if saved filter is displayed
    const savedFilter = screen.getByText(savedFiltersData[0].label);
    expect(savedFilter).toBeInTheDocument();
    
    // Apply saved filter
    fireEvent.click(savedFilter);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith(savedFiltersData[0].filters);
  });
  
  test('deletes saved filter correctly', async () => {
    const savedFiltersData = [{
      id: 12345,
      label: 'Volume (Low to High) | Time: 7d | Token: ETH | Min TVL: $10K+',
      filters: {
        sortBy: 'volume7d',
        sortOrder: 'asc',
        token: 'ETH',
        minTvl: 10000,
        timeframe: '7d'
      }
    }];
    
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(savedFiltersData));
    
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    // Find delete button (× character)
    const deleteButton = screen.getByTitle('Delete this saved filter');
    
    // Click delete button
    fireEvent.click(deleteButton);
    
    // Check if localStorage was updated with empty array
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'poolSavedFilters',
        '[]'
      );
    });
  });
  
  test('does not save duplicate filters', async () => {
    const customFilters = {
      sortBy: 'volume24h',
      sortOrder: 'asc',
      token: 'ETH',
      minTvl: 10000,
      timeframe: '7d'
    };
    
    const savedFiltersData = [{
      id: 12345,
      label: 'Volume (Low to High) | Time: 7d | Token: ETH | Min TVL: $10K+',
      filters: customFilters
    }];
    
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(savedFiltersData));
    
    render(
      <PoolFilters 
        filters={customFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    // Try to save the same filter again
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);
    
    // Should not call setItem with a new entry
    expect(localStorage.setItem).not.toHaveBeenCalledWith(
      'poolSavedFilters',
      expect.stringContaining('"id":12345')
    );
  });
  
  test('saves filters to localStorage when they change', () => {
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    // Verify initial save
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'poolFilters',
      JSON.stringify(defaultFilters)
    );
    
    // Clear mock to check next call
    localStorage.setItem.mockClear();
    
    // Simulate props update
    const updatedFilters = {
      ...defaultFilters,
      token: 'ETH'
    };
    
    render(
      <PoolFilters 
        filters={updatedFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'poolFilters',
      JSON.stringify(updatedFilters)
    );
  });
}); 