import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import InfoIcon from '../../../components/common/InfoIcon';
import EnhancedTooltip from '../../../components/common/EnhancedTooltip';

// Mock the EnhancedTooltip component
jest.mock('../../../components/common/EnhancedTooltip', () => {
  return jest.fn(({ children, content, position }) => (
    <div
      data-testid="mocked-enhanced-tooltip"
      data-content={content}
      data-position={position}
    >
      {children}
    </div>
  ));
});

// Mock the InfoIcon module SCSS
jest.mock('../../../components/common/InfoIcon.module.scss', () => ({
  infoIcon: 'infoIcon',
  small: 'small',
  medium: 'medium',
  large: 'large',
}));

describe('InfoIcon Component', () => {
  beforeEach(() => {
    EnhancedTooltip.mockClear();
  });

  it('renders the info icon with default props', () => {
    render(<InfoIcon content="Test tooltip content" />);

    // Instead of checking call arguments directly, check rendered attributes
    const tooltip = screen.getByTestId('mocked-enhanced-tooltip');
    expect(tooltip).toHaveAttribute('data-content', 'Test tooltip content');
    expect(tooltip).toHaveAttribute('data-position', 'top');

    // Check if the info icon is rendered with the correct text
    const infoSpan = screen.getByText('i');
    expect(infoSpan).toBeInTheDocument();
    expect(infoSpan).toHaveClass('infoIcon');
    expect(infoSpan).toHaveClass('small');
  });

  it('renders with custom position prop', () => {
    render(<InfoIcon content="Custom position" position="bottom" />);

    const tooltip = screen.getByTestId('mocked-enhanced-tooltip');
    expect(tooltip).toHaveAttribute('data-content', 'Custom position');
    expect(tooltip).toHaveAttribute('data-position', 'bottom');
  });

  it('renders with medium size class', () => {
    render(<InfoIcon content="Medium icon" size="medium" />);

    const infoSpan = screen.getByText('i');
    expect(infoSpan).toHaveClass('medium');
  });

  it('renders with large size class', () => {
    render(<InfoIcon content="Large icon" size="large" />);

    const infoSpan = screen.getByText('i');
    expect(infoSpan).toHaveClass('large');
  });

  it('uses default small size for invalid size prop', () => {
    render(<InfoIcon content="Invalid size" size="invalid" />);

    const infoSpan = screen.getByText('i');
    expect(infoSpan).toHaveClass('small');
  });

  it('adds correct accessibility label', () => {
    render(<InfoIcon content="Accessible info" />);

    const infoSpan = screen.getByLabelText('Information');
    expect(infoSpan).toBeInTheDocument();
  });
});
