import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LendingPoolFilters from '@/components/lending/LendingPoolFilters';
import { LendingFilters } from '@/hooks/useLendingPools';

const mockFilterOptions = {
  tokens: [
    { mint: '0x123', symbol: 'TEST1', name: 'Test Token 1', icon: 'test1.png' },
    { mint: '0x456', symbol: 'TEST2', name: 'Test Token 2', icon: 'test2.png' }
  ],
  tvlRanges: [
    { value: 0, label: 'All' },
    { value: 100000, label: '$100k+' },
    { value: 1000000, label: '$1M+' }
  ],
  utilizationRanges: [
    { value: 0, label: 'All' },
    { value: 50, label: '50%+' },
    { value: 75, label: '75%+' }
  ],
  supplyApyRanges: [
    { value: 0, label: 'All' },
    { value: 5, label: '5%+' },
    { value: 10, label: '10%+' }
  ],
  borrowApyRanges: [
    { value: 0, label: 'All' },
    { value: 7, label: '7%+' },
    { value: 12, label: '12%+' }
  ]
};

const defaultFilters: LendingFilters = {
  sortBy: 'tvl',
  sortOrder: 'desc',
  token: '',
  minTvl: 0,
  minSupplyApy: 0,
  minBorrowApy: 0,
  minUtilization: 0
};

describe('LendingPoolFilters', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders all filter options correctly', () => {
    render(
      <LendingPoolFilters
        filters={defaultFilters}
        onFilterChange={() => {}}
        filterOptions={mockFilterOptions}
      />
    );

    // Check if sort options are rendered
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('TVL (High to Low)')).toBeInTheDocument();

    // Check if token filter is rendered
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('All Tokens')).toBeInTheDocument();

    // Check if TVL filter is rendered
    expect(screen.getByText('Min TVL')).toBeInTheDocument();
    expect(screen.getByText('$100k+')).toBeInTheDocument();
    expect(screen.getByText('$1M+')).toBeInTheDocument();
  });

  it('handles sort change correctly', () => {
    const mockOnFilterChange = jest.fn();
    
    render(
      <LendingPoolFilters
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        filterOptions={mockFilterOptions}
      />
    );

    const sortSelect = screen.getByRole('combobox', { name: 'Sort By' });
    fireEvent.change(sortSelect, { target: { value: 'supplyApy:desc' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      sortBy: 'supplyApy',
      sortOrder: 'desc'
    });
  });

  it('handles token selection correctly', () => {
    const mockOnFilterChange = jest.fn();
    
    render(
      <LendingPoolFilters
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        filterOptions={mockFilterOptions}
      />
    );

    // Click the token select button
    const tokenSelectButton = screen.getByText('All Tokens');
    fireEvent.click(tokenSelectButton);

    // Select a token
    const tokenOption = screen.getByText('TEST1');
    fireEvent.click(tokenOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      token: '0x123'
    });
  });

  it('handles reset filters correctly', () => {
    const mockOnFilterChange = jest.fn();
    const currentFilters: LendingFilters = {
      ...defaultFilters,
      token: '0x123',
      minTvl: 1000000,
      minSupplyApy: 5
    };
    
    render(
      <LendingPoolFilters
        filters={currentFilters}
        onFilterChange={mockOnFilterChange}
        filterOptions={mockFilterOptions}
      />
    );

    const resetButton = screen.getByText('Clear All');
    fireEvent.click(resetButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(defaultFilters);
  });

  it('saves and loads filters from localStorage', () => {
    const mockOnFilterChange = jest.fn();
    const savedFilters = {
      id: 1,
      label: 'High TVL',
      filters: {
        ...defaultFilters,
        minTvl: 1000000
      }
    };

    localStorage.setItem('lendingPoolSavedFilters', JSON.stringify([savedFilters]));
    
    render(
      <LendingPoolFilters
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        filterOptions={mockFilterOptions}
      />
    );

    // Check if saved filter is rendered
    expect(screen.getByText('High TVL')).toBeInTheDocument();

    // Apply saved filter
    fireEvent.click(screen.getByText('High TVL'));
    expect(mockOnFilterChange).toHaveBeenCalledWith(savedFilters.filters);
  });

  it('saves current filter configuration', () => {
    const currentFilters: LendingFilters = {
      ...defaultFilters,
      minTvl: 1000000,
      minSupplyApy: 5
    };
    
    render(
      <LendingPoolFilters
        filters={currentFilters}
        onFilterChange={() => {}}
        filterOptions={mockFilterOptions}
      />
    );

    const saveButton = screen.getByText('Save Filters');
    fireEvent.click(saveButton);

    const savedFilters = JSON.parse(localStorage.getItem('lendingPoolSavedFilters') || '[]');
    expect(savedFilters).toHaveLength(1);
    expect(savedFilters[0].filters).toEqual(currentFilters);
  });

  it('has accessible filter selects', () => {
    render(
      <LendingPoolFilters
        filters={defaultFilters}
        onFilterChange={() => {}}
        filterOptions={mockFilterOptions}
      />
    );

    // Verify all filter selects have proper accessibility attributes
    expect(screen.getByRole('combobox', { name: 'Sort By' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Min TVL' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Min Supply APY' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Min Borrow APY' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Min Utilization' })).toBeInTheDocument();
  });
}); 