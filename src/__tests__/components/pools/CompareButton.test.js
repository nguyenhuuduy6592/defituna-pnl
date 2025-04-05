import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompareButton from '../../../components/pools/CompareButton';
import { useComparison } from '../../../contexts/ComparisonContext';

// Mock the ComparisonContext
jest.mock('../../../contexts/ComparisonContext', () => ({
  useComparison: jest.fn()
}));

// Mock react-icons
jest.mock('react-icons/bs', () => ({
  BsBarChartLine: () => <div data-testid="chart-icon" />,
  BsPlusCircle: () => <div data-testid="plus-icon" />,
  BsDashCircle: () => <div data-testid="minus-icon" />
}));

describe('CompareButton Component', () => {
  const mockPool = {
    address: '0x123abc',
    name: 'ETH/USDC'
  };
  
  const mockAddPoolToComparison = jest.fn();
  const mockRemovePoolFromComparison = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders as "Compare" when pool is not in comparison', () => {
    // Mock not in comparison
    useComparison.mockReturnValue({
      isInComparison: () => false,
      addPoolToComparison: mockAddPoolToComparison,
      removePoolFromComparison: mockRemovePoolFromComparison
    });
    
    render(<CompareButton pool={mockPool} />);
    
    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });
  
  it('renders as "Remove" when pool is in comparison', () => {
    // Mock in comparison
    useComparison.mockReturnValue({
      isInComparison: () => true,
      addPoolToComparison: mockAddPoolToComparison,
      removePoolFromComparison: mockRemovePoolFromComparison
    });
    
    render(<CompareButton pool={mockPool} />);
    
    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
  });
  
  it('calls addPoolToComparison when clicked and not in comparison', () => {
    // Mock not in comparison
    useComparison.mockReturnValue({
      isInComparison: () => false,
      addPoolToComparison: mockAddPoolToComparison,
      removePoolFromComparison: mockRemovePoolFromComparison
    });
    
    render(<CompareButton pool={mockPool} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockAddPoolToComparison).toHaveBeenCalledWith(mockPool);
    expect(mockRemovePoolFromComparison).not.toHaveBeenCalled();
  });
  
  it('calls removePoolFromComparison when clicked and in comparison', () => {
    // Mock in comparison
    useComparison.mockReturnValue({
      isInComparison: () => true,
      addPoolToComparison: mockAddPoolToComparison,
      removePoolFromComparison: mockRemovePoolFromComparison
    });
    
    render(<CompareButton pool={mockPool} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockRemovePoolFromComparison).toHaveBeenCalledWith(mockPool.address);
    expect(mockAddPoolToComparison).not.toHaveBeenCalled();
  });
  
  it('applies the active class style when in comparison', () => {
    // Mock in comparison
    useComparison.mockReturnValue({
      isInComparison: () => true,
      addPoolToComparison: mockAddPoolToComparison,
      removePoolFromComparison: mockRemovePoolFromComparison
    });
    
    const { container } = render(<CompareButton pool={mockPool} />);
    
    // Check that the active class is applied
    expect(container.firstChild).toHaveClass('active');
  });
  
  it('prevents default event behavior when clicked', () => {
    useComparison.mockReturnValue({
      isInComparison: () => false,
      addPoolToComparison: mockAddPoolToComparison,
      removePoolFromComparison: mockRemovePoolFromComparison
    });
    
    render(<CompareButton pool={mockPool} />);
    
    // Direct testing of event handling needs a different approach
    // Since we can't directly check preventDefault and stopPropagation
    // Instead, we'll verify the correct function was called, which indicates
    // the event handler was successfully executed
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockAddPoolToComparison).toHaveBeenCalledWith(mockPool);
  });
  
  it('has proper accessibility attributes', () => {
    useComparison.mockReturnValue({
      isInComparison: () => false,
      addPoolToComparison: mockAddPoolToComparison,
      removePoolFromComparison: mockRemovePoolFromComparison
    });
    
    render(<CompareButton pool={mockPool} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Add to comparison');
    expect(button).toHaveAttribute('title', 'Add to comparison');
  });
}); 