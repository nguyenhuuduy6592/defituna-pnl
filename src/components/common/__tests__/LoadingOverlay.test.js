import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingOverlay } from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  const defaultProps = {
    loading: false,
    children: <div data-testid="test-content">Test Content</div>
  };

  it('renders children when not loading', () => {
    render(<LoadingOverlay {...defaultProps} />);
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toHaveTextContent('Test Content');
    expect(screen.queryByText('Refreshing...')).not.toBeInTheDocument();
  });

  it('renders loading overlay with default message when loading', () => {
    render(<LoadingOverlay {...defaultProps} loading={true} />);
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('renders loading overlay with custom message', () => {
    const customMessage = 'Custom Loading Message';
    render(
      <LoadingOverlay {...defaultProps} loading={true} message={customMessage} />
    );
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('applies correct classes based on loading state', () => {
    const { rerender } = render(<LoadingOverlay {...defaultProps} loading={true} />);
    const overlay = screen.getByText('Refreshing...').parentElement;
    expect(overlay).toHaveClass('loadingOverlay');
    expect(overlay).not.toHaveClass('loadingOverlayHidden');

    rerender(<LoadingOverlay {...defaultProps} loading={false} />);
    expect(overlay).toHaveClass('loadingOverlay', 'loadingOverlayHidden');
  });

  it('has correct accessibility attributes when loading', () => {
    render(<LoadingOverlay {...defaultProps} loading={true} />);
    const overlay = screen.getByText('Refreshing...').parentElement;
    expect(overlay).toHaveAttribute('aria-hidden', 'false');
    expect(overlay).toHaveAttribute('aria-live', 'polite');
  });

  it('has correct accessibility attributes when not loading', () => {
    const { container } = render(<LoadingOverlay {...defaultProps} loading={false} />);
    // Use a more specific selector to get the overlay element
    const overlay = container.querySelector('.loadingOverlay.loadingOverlayHidden');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay).toHaveAttribute('aria-live', 'polite');
  });

  it('renders multiple children correctly', () => {
    const children = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </>
    );
    render(<LoadingOverlay {...defaultProps} children={children} />);
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('maintains children visibility during loading', () => {
    const { rerender } = render(<LoadingOverlay {...defaultProps} loading={false} />);
    expect(screen.getByTestId('test-content')).toBeVisible();

    rerender(<LoadingOverlay {...defaultProps} loading={true} />);
    expect(screen.getByTestId('test-content')).toBeVisible();
  });
}); 