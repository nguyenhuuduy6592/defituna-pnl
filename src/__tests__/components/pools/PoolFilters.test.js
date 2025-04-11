import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PoolFilters from '@/components/pools/PoolFilters';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';

// Mock IndexedDB utility functions
jest.mock('@/utils/indexedDB', () => ({
  initializeDB: jest.fn().mockResolvedValue({}),
  getData: jest.fn(),
  saveData: jest.fn().mockResolvedValue(true),
  STORE_NAMES: {
    SETTINGS: 'settings'
  }
}));

// Mock TimeframeSelector since it's a UI component we can test separately
jest.mock('@/components/common/TimeframeSelector', () => {
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
  
  test('loads filters from IndexedDB on mount', async () => {
    const savedFilters = {
      sortBy: 'volume24h',
      sortOrder: 'asc',
      token: 'ETH',
      minTvl: 10000,
      timeframe: '7d'
    };
    
    getData.mockImplementation((db, storeName, key) => {
      if (key === 'poolFilters') {
        return Promise.resolve({ value: savedFilters });
      }
      return Promise.resolve(null);
    });
    
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(savedFilters);
    });
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
    
    getData.mockImplementation((db, storeName, key) => {
      if (key === 'poolSavedFilters') {
        return Promise.resolve({ value: [] });
      }
      return Promise.resolve(null);
    });
    
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
      expect(saveData).toHaveBeenCalledWith(
        expect.anything(),
        STORE_NAMES.SETTINGS,
        {
          key: 'poolSavedFilters',
          value: [{
            id: 12345,
            label: 'Volume (Low to High) | Time: 7d | Token: ETH | Min TVL: $10K+',
            filters: customFilters
          }]
        }
      );
    });
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
    
    getData.mockImplementation((db, storeName, key) => {
      if (key === 'poolSavedFilters') {
        return Promise.resolve({ value: savedFiltersData });
      }
      return Promise.resolve(null);
    });
    
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    // Wait for saved filters to load
    await waitFor(() => {
      expect(screen.getByText(savedFiltersData[0].label)).toBeInTheDocument();
    });
    
    // Apply saved filter
    fireEvent.click(screen.getByText(savedFiltersData[0].label));
    
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
    
    getData.mockImplementation((db, storeName, key) => {
      if (key === 'poolSavedFilters') {
        return Promise.resolve({ value: savedFiltersData });
      }
      return Promise.resolve(null);
    });
    
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    // Wait for saved filters to load
    await waitFor(() => {
      expect(screen.getByTitle('Delete this saved filter')).toBeInTheDocument();
    });
    
    // Click delete button
    fireEvent.click(screen.getByTitle('Delete this saved filter'));
    
    await waitFor(() => {
      expect(saveData).toHaveBeenCalledWith(
        expect.anything(),
        STORE_NAMES.SETTINGS,
        {
          key: 'poolSavedFilters',
          value: []
        }
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
    
    getData.mockImplementation((db, storeName, key) => {
      if (key === 'poolSavedFilters') {
        return Promise.resolve({ value: savedFiltersData });
      }
      return Promise.resolve(null);
    });
    
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
    
    // Should not call saveData with a new entry
    expect(saveData).not.toHaveBeenCalled();
  });
  
  test('saves filters to IndexedDB when they change', async () => {
    render(
      <PoolFilters 
        filters={defaultFilters} 
        onFilterChange={mockOnFilterChange} 
        filterOptions={filterOptions}
      />
    );
    
    // Verify initial save
    await waitFor(() => {
      expect(saveData).toHaveBeenCalledWith(
        expect.anything(),
        STORE_NAMES.SETTINGS,
        {
          key: 'poolFilters',
          value: defaultFilters
        }
      );
    });
    
    // Clear mock to check next call
    saveData.mockClear();
    
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
    
    await waitFor(() => {
      expect(saveData).toHaveBeenCalledWith(
        expect.anything(),
        STORE_NAMES.SETTINGS,
        {
          key: 'poolFilters',
          value: updatedFilters
        }
      );
    });
  });
}); 