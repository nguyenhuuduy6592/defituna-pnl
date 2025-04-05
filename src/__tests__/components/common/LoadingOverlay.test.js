import React from 'react';
import { render, screen } from '../test-utils';
import { LoadingOverlay } from '../../../components/common/LoadingOverlay';

describe('LoadingOverlay Component', () => {
  const childText = 'Child Content';
  const defaultMessage = 'Refreshing...';
  const customMessage = 'Custom Loading Message';

  it('renders children when not loading', () => {
    render(
      <LoadingOverlay loading={false}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    expect(screen.getByText(childText)).toBeInTheDocument();
    expect(screen.queryByText(defaultMessage)).not.toBeInTheDocument();
  });

  it('renders children and loading message when loading', () => {
    render(
      <LoadingOverlay loading={true}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    expect(screen.getByText(childText)).toBeInTheDocument();
    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
  });

  it('renders custom loading message when provided', () => {
    render(
      <LoadingOverlay loading={true} message={customMessage}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.queryByText(defaultMessage)).not.toBeInTheDocument();
  });

  it('applies correct CSS classes based on loading state', () => {
    const { rerender } = render(
      <LoadingOverlay loading={true}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    // When loading
    const overlayWhenLoading = screen.getByText(defaultMessage).parentElement;
    expect(overlayWhenLoading).toHaveClass('loadingOverlay');
    expect(overlayWhenLoading).not.toHaveClass('loadingOverlayHidden');

    // When not loading
    rerender(
      <LoadingOverlay loading={false}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    const overlayWhenNotLoading = document.querySelector('[aria-hidden="true"]');
    expect(overlayWhenNotLoading).toHaveClass('loadingOverlay');
    expect(overlayWhenNotLoading).toHaveClass('loadingOverlayHidden');
  });

  it('sets correct ARIA attributes', () => {
    const { rerender } = render(
      <LoadingOverlay loading={true}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    let overlay = screen.getByText(defaultMessage).parentElement;
    expect(overlay).toHaveAttribute('aria-hidden', 'false');
    expect(overlay).toHaveAttribute('aria-live', 'polite');

    rerender(
      <LoadingOverlay loading={false}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay).toHaveAttribute('aria-live', 'polite');
  });

  it('handles empty children gracefully', () => {
    render(<LoadingOverlay loading={true} />);

    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
    expect(document.querySelector('.loadingContainer')).toBeInTheDocument();
  });

  it('handles null/undefined message prop gracefully', () => {
    render(
      <LoadingOverlay loading={true} message={undefined}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    expect(screen.getByText(defaultMessage)).toBeInTheDocument();

    const { rerender } = render(
      <LoadingOverlay loading={true} message={null}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
  });
}); 