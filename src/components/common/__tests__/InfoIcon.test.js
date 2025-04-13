import React from 'react';
import { render, screen } from '@testing-library/react';
import InfoIcon from '../InfoIcon';

// Mock EnhancedTooltip component
jest.mock('../EnhancedTooltip', () => {
  return function MockEnhancedTooltip({ children, content, position }) {
    return (
      <div data-testid="enhanced-tooltip" data-content={content} data-position={position}>
        {children}
      </div>
    );
  };
});

describe('InfoIcon', () => {
  const defaultProps = {
    content: 'Test tooltip content'
  };

  it('renders with default props', () => {
    render(<InfoIcon {...defaultProps} />);
    const tooltipWrapper = screen.getByTestId('enhanced-tooltip');
    const icon = screen.getByLabelText('Information');

    expect(tooltipWrapper).toBeInTheDocument();
    expect(tooltipWrapper).toHaveAttribute('data-content', 'Test tooltip content');
    expect(tooltipWrapper).toHaveAttribute('data-position', 'top');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('i');
    expect(icon).toHaveClass('infoIcon', 'small');
  });

  it('renders with custom position', () => {
    render(<InfoIcon {...defaultProps} position="bottom" />);
    const tooltipWrapper = screen.getByTestId('enhanced-tooltip');
    
    expect(tooltipWrapper).toHaveAttribute('data-position', 'bottom');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<InfoIcon {...defaultProps} size="medium" />);
    let icon = screen.getByLabelText('Information');
    expect(icon).toHaveClass('infoIcon', 'medium');

    rerender(<InfoIcon {...defaultProps} size="large" />);
    icon = screen.getByLabelText('Information');
    expect(icon).toHaveClass('infoIcon', 'large');

    rerender(<InfoIcon {...defaultProps} size="small" />);
    icon = screen.getByLabelText('Information');
    expect(icon).toHaveClass('infoIcon', 'small');
  });

  it('handles invalid size prop gracefully', () => {
    render(<InfoIcon {...defaultProps} size="invalid" />);
    const icon = screen.getByLabelText('Information');
    expect(icon).toHaveClass('infoIcon', 'small'); // Check for both classes
  });

  it('passes content to EnhancedTooltip', () => {
    const content = 'Custom tooltip content';
    render(<InfoIcon content={content} />);
    const tooltipWrapper = screen.getByTestId('enhanced-tooltip');
    expect(tooltipWrapper).toHaveAttribute('data-content', content);
  });
}); 