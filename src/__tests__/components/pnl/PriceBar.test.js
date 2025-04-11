import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriceBar } from '@/components/pnl/PriceBar';

// Mock the TooltipPortal component
jest.mock('@/components/common/TooltipPortal', () => ({
  TooltipPortal: ({ children, targetRef, show }) => (
    show ? <div data-testid="tooltip-portal">{children}</div> : null
  )
}));

describe('PriceBar', () => {
  // Default props
  const defaultProps = {
    currentPrice: 50000,
    entryPrice: 45000,
    liquidationPrice: {
      lower: 30000,
      upper: 70000
    },
    rangePrices: {
      lower: 40000,
      upper: 60000
    },
    limitOrderPrices: {
      lower: 35000,
      upper: 65000
    },
    formatValue: (value) => value.toLocaleString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the price bar with all valid price points', () => {
    render(<PriceBar {...defaultProps} />);
    
    // Check that the container is rendered
    const container = screen.getByLabelText('Price bar showing current, entry, and key price levels');
    expect(container).toBeInTheDocument();
    
    // Check that all price markers are rendered
    // We have 8 price points in total
    const priceMarkers = container.querySelectorAll('div[aria-label]');
    expect(priceMarkers.length).toBe(8);
    
    // Verify specific price points
    expect(screen.getByLabelText('Current: 50000')).toBeInTheDocument();
    expect(screen.getByLabelText('Entry: 45000')).toBeInTheDocument();
    expect(screen.getByLabelText('Liq. Lower: 30000')).toBeInTheDocument();
    expect(screen.getByLabelText('Liq. Upper: 70000')).toBeInTheDocument();
    expect(screen.getByLabelText('Range Lower: 40000')).toBeInTheDocument();
    expect(screen.getByLabelText('Range Upper: 60000')).toBeInTheDocument();
    expect(screen.getByLabelText('Stop Loss: 35000')).toBeInTheDocument();
    expect(screen.getByLabelText('Take Profit: 65000')).toBeInTheDocument();
  });

  it('shows tooltip when hovering over the price bar', () => {
    render(<PriceBar {...defaultProps} />);
    
    // Initially, tooltip should not be visible
    expect(screen.queryByTestId('tooltip-portal')).not.toBeInTheDocument();
    
    // Hover over the price bar
    const priceBar = screen.getByLabelText('Price bar showing current, entry, and key price levels');
    fireEvent.mouseEnter(priceBar);
    
    // Tooltip should now be visible
    expect(screen.getByTestId('tooltip-portal')).toBeInTheDocument();
    
    // Check tooltip content for all price points
    expect(screen.getByText('Current:')).toBeInTheDocument();
    expect(screen.getByText('Entry:')).toBeInTheDocument();
    expect(screen.getByText('Liq. Lower:')).toBeInTheDocument();
    expect(screen.getByText('Liq. Upper:')).toBeInTheDocument();
    expect(screen.getByText('Range Lower:')).toBeInTheDocument();
    expect(screen.getByText('Range Upper:')).toBeInTheDocument();
    expect(screen.getByText('Stop Loss:')).toBeInTheDocument();
    expect(screen.getByText('Take Profit:')).toBeInTheDocument();
    
    // Price values should be formatted
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('$45,000')).toBeInTheDocument();
    
    // Tooltip should hide when mouse leaves
    fireEvent.mouseLeave(priceBar);
    expect(screen.queryByTestId('tooltip-portal')).not.toBeInTheDocument();
  });

  it('filters out invalid price points', () => {
    const propsWithInvalidPrices = {
      ...defaultProps,
      liquidationPrice: {
        lower: 0, // Invalid
        upper: Infinity // Invalid
      },
      rangePrices: {
        lower: null, // Invalid
        upper: 60000
      }
    };
    
    render(<PriceBar {...propsWithInvalidPrices} />);
    
    // Should only render valid price points
    const container = screen.getByLabelText('Price bar showing current, entry, and key price levels');
    const priceMarkers = container.querySelectorAll('div[aria-label]');
    expect(priceMarkers.length).toBe(5); // 8 original - 3 invalid = 5
    
    // Invalid price points should not be rendered
    expect(screen.queryByLabelText('Liq. Lower: 0')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Liq. Upper: Infinity')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Range Lower: null')).not.toBeInTheDocument();
    
    // Valid price points should still be rendered
    expect(screen.getByLabelText('Current: 50000')).toBeInTheDocument();
    expect(screen.getByLabelText('Entry: 45000')).toBeInTheDocument();
    expect(screen.getByLabelText('Range Upper: 60000')).toBeInTheDocument();
    expect(screen.getByLabelText('Stop Loss: 35000')).toBeInTheDocument();
    expect(screen.getByLabelText('Take Profit: 65000')).toBeInTheDocument();
  });

  it('positions price markers correctly based on their values', () => {
    render(<PriceBar {...defaultProps} />);
    
    // Get all price markers
    const container = screen.getByLabelText('Price bar showing current, entry, and key price levels');
    const priceMarkers = Array.from(container.querySelectorAll('div[aria-label]'));
    
    // Extract positions from style attribute
    const positions = priceMarkers.map(marker => {
      const style = window.getComputedStyle(marker);
      return parseFloat(style.left);
    });
    
    // Remove the position order check since PriceBar sorts markers from highest to lowest
    // Instead, check specific positions for certain price points
    
    // Specific test: lowest price (30000) should be at 0%
    const liqLowerMarker = screen.getByLabelText('Liq. Lower: 30000');
    expect(liqLowerMarker).toHaveStyle('left: 0%');
    
    // Specific test: highest price (70000) should be at 100%
    const liqUpperMarker = screen.getByLabelText('Liq. Upper: 70000');
    expect(liqUpperMarker).toHaveStyle('left: 100%');
    
    // Current price (50000) should be at 50% (exactly in the middle between 30000 and 70000)
    const currentPriceMarker = screen.getByLabelText('Current: 50000');
    expect(currentPriceMarker).toHaveStyle('left: 50%');
  });

  it('uses custom formatValue function for tooltip values', () => {
    const customProps = {
      ...defaultProps,
      formatValue: (value) => `$${value / 1000}K`
    };
    
    render(<PriceBar {...customProps} />);
    
    // Hover over the price bar to show tooltip
    const priceBar = screen.getByLabelText('Price bar showing current, entry, and key price levels');
    fireEvent.mouseEnter(priceBar);
    
    // Check that values are formatted with the custom function using more specific selectors
    // The actual structure in the DOM is <span class="tooltipValue">$<value></span>
    const tooltipRows = screen.getAllByTestId('tooltip-portal')[0].querySelectorAll('.tooltipValue');
    
    // Just verify we have the expected number of tooltip rows
    expect(tooltipRows.length).toBe(8); // One for each price point
    
    // Check a few sample values using a more flexible approach
    expect(screen.getByText(/\$50K/)).toBeInTheDocument();
    expect(screen.getByText(/\$45K/)).toBeInTheDocument();
    expect(screen.getByText(/\$30K/)).toBeInTheDocument();
  });
}); 