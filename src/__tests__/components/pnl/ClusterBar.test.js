import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClusterBar } from '../../../components/pnl/ClusterBar';

// Mock the TooltipPortal component
jest.mock('../../../components/common/TooltipPortal', () => ({
  TooltipPortal: ({ children, targetRef, show }) =>
    show ? <div data-testid="tooltip-portal">{children}</div> : null,
}));

describe('ClusterBar', () => {
  // Default props
  const defaultProps = {
    size: 1000,
    collateral: { usd: 600 },
    debt: { usd: 300 },
    interest: { usd: 100 },
    formatValue: (val) => val.toLocaleString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct segment proportions', () => {
    render(<ClusterBar {...defaultProps} />);

    // Check the container is rendered
    expect(
      screen.getByLabelText('Position composition breakdown')
    ).toBeInTheDocument();

    // Check all segments are rendered with correct percentages
    expect(screen.getByLabelText('Collateral: 60.0%')).toBeInTheDocument();
    expect(screen.getByLabelText('Debt: 30.0%')).toBeInTheDocument();
    expect(screen.getByLabelText('Interest: 10.0%')).toBeInTheDocument();

    // Check the total value is displayed correctly
    expect(screen.getByLabelText('Total: $1,000')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('shows tooltip on mouse enter and hides on mouse leave', () => {
    render(<ClusterBar {...defaultProps} />);

    // Initially tooltip should not be visible
    expect(screen.queryByTestId('tooltip-portal')).not.toBeInTheDocument();

    // Show tooltip on mouse enter
    const barContainer = screen
      .getByLabelText('Position composition breakdown')
      .querySelector('div');
    fireEvent.mouseEnter(barContainer);

    // Tooltip should be visible with correct data
    expect(screen.getByTestId('tooltip-portal')).toBeInTheDocument();
    expect(screen.getByText('Total Size:')).toBeInTheDocument();
    expect(screen.getByText('Collateral:')).toBeInTheDocument();
    expect(screen.getByText('Debt:')).toBeInTheDocument();
    expect(screen.getByText('Interest:')).toBeInTheDocument();

    // Values should be formatted
    expect(screen.getAllByText('$1,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$600').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$300').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$100').length).toBeGreaterThan(0);

    // Hide tooltip on mouse leave
    fireEvent.mouseLeave(barContainer);
    expect(screen.queryByTestId('tooltip-portal')).not.toBeInTheDocument();
  });

  it('handles zero values correctly', () => {
    render(
      <ClusterBar
        size={0}
        collateral={{ usd: 0 }}
        debt={{ usd: 0 }}
        interest={{ usd: 0 }}
      />
    );

    // All segments should show 0%
    expect(screen.getByLabelText('Collateral: 0.0%')).toBeInTheDocument();
    expect(screen.getByLabelText('Debt: 0.0%')).toBeInTheDocument();
    expect(screen.getByLabelText('Interest: 0.0%')).toBeInTheDocument();

    // Total should be 0
    expect(screen.getByLabelText('Total: $0')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('handles negative values by using absolute values', () => {
    const negativeProps = {
      size: -1000,
      collateral: { usd: -600 },
      debt: { usd: -300 },
      interest: { usd: -100 },
    };

    render(<ClusterBar {...negativeProps} />);

    // Segments should use absolute values for percentages
    expect(screen.getByLabelText('Collateral: 60.0%')).toBeInTheDocument();
    expect(screen.getByLabelText('Debt: 30.0%')).toBeInTheDocument();
    expect(screen.getByLabelText('Interest: 10.0%')).toBeInTheDocument();

    // Total value should show the negative value
    expect(screen.getByLabelText('Total: $-1,000')).toBeInTheDocument();
    expect(screen.getByText('$-1,000')).toBeInTheDocument();
  });

  it('handles missing values by defaulting to zero', () => {
    // No debt or interest provided
    render(<ClusterBar size={1000} collateral={{ usd: 1000 }} />);

    // Collateral should be 100%, others 0%
    expect(screen.getByLabelText('Collateral: 100.0%')).toBeInTheDocument();
    expect(screen.getByLabelText('Debt: 0.0%')).toBeInTheDocument();
    expect(screen.getByLabelText('Interest: 0.0%')).toBeInTheDocument();
  });

  it('uses custom formatValue function', () => {
    const customFormatProps = {
      ...defaultProps,
      formatValue: (val) => `${val / 1000}K`,
    };

    render(<ClusterBar {...customFormatProps} />);

    // Total value should use the custom format
    expect(screen.getAllByText('$1K').length).toBeGreaterThan(0);

    // Show tooltip to check formatted values
    const barContainer = screen
      .getByLabelText('Position composition breakdown')
      .querySelector('div');
    fireEvent.mouseEnter(barContainer);

    // Check for custom formatted values in tooltip
    expect(screen.getAllByText('$1K').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$0.6K').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$0.3K').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$0.1K').length).toBeGreaterThan(0);
  });
});
