import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { PriceBar } from '../../../components/pnl/PriceBar';

// Mock the TooltipPortal component
jest.mock('../../../components/common/TooltipPortal', () => ({
  TooltipPortal: ({ children, targetRef, show }) => (
    show ? <div data-testid="tooltip-portal">{children}</div> : null
  ),
}));

describe('PriceBar', () => {
  // Default props
  const defaultProps = {
    currentPrice: 50000,
    entryPrice: 45000,
    liquidationPrice: {
      lower: 30000,
      upper: 70000,
    },
    rangePrices: {
      lower: 40000,
      upper: 60000,
    },
    limitOrderPrices: {
      lower: 35000,
      upper: 65000,
    },
    formatValue: (value) => value?.toLocaleString() ?? 'N/A',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the price bar with range labels and current price indicator', () => {
    render(<PriceBar {...defaultProps} />);

    const container = screen.getByLabelText('Price range bar with current price indicator');
    expect(container).toBeInTheDocument();

    // Check that range labels are rendered
    const labels = screen.getAllByText(/^\$[0-9,]+$/);
    expect(labels).toHaveLength(2);
    expect(labels[0].textContent).toBe('$40,000');
    expect(labels[1].textContent).toBe('$60,000');

    const priceIndicator = screen.getByLabelText('Current price: 50000');
    expect(priceIndicator).toBeInTheDocument();
    expect(priceIndicator).toHaveClass('priceIndicator');
  });

  it('shows tooltip with all price points when hovering', () => {
    render(<PriceBar {...defaultProps} />);

    expect(screen.queryByTestId('tooltip-portal')).not.toBeInTheDocument();

    const priceBar = screen.getByLabelText('Price range bar with current price indicator');
    fireEvent.mouseEnter(priceBar);

    const tooltip = screen.getByTestId('tooltip-portal');
    expect(tooltip).toBeInTheDocument();

    const expectedPrices = [
      { label: 'Liq. Upper:', value: '$70,000' },
      { label: 'Take Profit:', value: '$65,000' },
      { label: 'Range Upper:', value: '$60,000' },
      { label: 'Current:', value: '$50,000' },
      { label: 'Entry:', value: '$45,000' },
      { label: 'Range Lower:', value: '$40,000' },
      { label: 'Stop Loss:', value: '$35,000' },
      { label: 'Liq. Lower:', value: '$30,000' },
    ];

    expectedPrices.forEach(({ label, value }) => {
      const row = within(tooltip).getByText(label).closest('.tooltipRow');
      expect(within(row).getByText((content, element) => {
        return element.className === 'tooltipValue' && element.textContent === value;
      })).toBeInTheDocument();
    });

    fireEvent.mouseLeave(priceBar);
    expect(screen.queryByTestId('tooltip-portal')).not.toBeInTheDocument();
  });

  it('filters out invalid price points in tooltip', () => {
    const propsWithInvalidPrices = {
      ...defaultProps,
      liquidationPrice: {
        lower: 0,
        upper: Infinity,
      },
      rangePrices: {
        lower: null,
        upper: 60000,
      },
    };

    render(<PriceBar {...propsWithInvalidPrices} />);

    const priceBar = screen.getByLabelText('Price range bar with current price indicator');
    fireEvent.mouseEnter(priceBar);

    const tooltip = screen.getByTestId('tooltip-portal');

    // Invalid price points should not be in tooltip
    expect(within(tooltip).queryByText('0')).not.toBeInTheDocument();
    expect(within(tooltip).queryByText('Infinity')).not.toBeInTheDocument();
    expect(within(tooltip).queryByText('null')).not.toBeInTheDocument();

    // Valid price points should still be in tooltip
    const validPrices = ['$50,000', '$45,000', '$60,000', '$35,000', '$65,000'];
    validPrices.forEach(price => {
      expect(within(tooltip).getByText((content, element) => {
        return element.className === 'tooltipValue' && element.textContent === price;
      })).toBeInTheDocument();
    });
  });

  it('positions current price indicator correctly based on range', () => {
    render(<PriceBar {...defaultProps} />);

    const priceIndicator = screen.getByLabelText('Current price: 50000');

    const leftPosition = parseFloat(priceIndicator.style.left);
    expect(leftPosition).toBeCloseTo(50, 1);

    // Check indicator color based on range
    expect(priceIndicator.style.backgroundColor).toBe('rgb(255, 204, 0)'); // In range = yellow
  });

  it('shows red indicator when price is out of range', () => {
    const outOfRangeProps = {
      ...defaultProps,
      currentPrice: 65000,
    };

    render(<PriceBar {...outOfRangeProps} />);

    const priceIndicator = screen.getByLabelText('Current price: 65000');
    expect(priceIndicator.style.backgroundColor).toBe('rgb(255, 45, 85)'); // Out of range = red
  });

  it('uses custom formatValue function for price labels and tooltip', () => {
    const customProps = {
      ...defaultProps,
      formatValue: (value) => `${value / 1000}K`,
    };

    render(<PriceBar {...customProps} />);

    // Check range labels
    const labels = screen.getAllByText(/^\$\d+K$/);
    expect(labels).toHaveLength(2);
    expect(labels[0].textContent).toBe('$40K');
    expect(labels[1].textContent).toBe('$60K');

    // Check tooltip formatting
    fireEvent.mouseEnter(screen.getByLabelText('Price range bar with current price indicator'));
    const tooltip = screen.getByTestId('tooltip-portal');

    expect(within(tooltip).getByText((content, element) => {
      return element.className === 'tooltipValue' && element.textContent === '$50K';
    })).toBeInTheDocument();
    expect(within(tooltip).getByText((content, element) => {
      return element.className === 'tooltipValue' && element.textContent === '$45K';
    })).toBeInTheDocument();
  });
});