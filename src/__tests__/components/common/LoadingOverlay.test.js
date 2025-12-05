import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingOverlay } from '../../../components/common/LoadingOverlay';

// Mock the LoadingOverlay styles
jest.mock('../../../components/common/LoadingOverlay.module.scss', () => ({
  loadingContainer: 'loadingContainer',
  loadingOverlay: 'loadingOverlay',
  loadingOverlayHidden: 'loadingOverlayHidden',
}));

describe('LoadingOverlay Component', () => {
  const childText = 'Child Content';
  const defaultMessage = 'Refreshing...';
  const customMessage = 'Custom Loading Message';

  it('renders children when not loading', () => {
    render(
      <LoadingOverlay loading={false}>
        <div data-testid="child-content">{childText}</div>
      </LoadingOverlay>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText(childText)).toBeInTheDocument();
    expect(screen.queryByText(defaultMessage)).not.toBeInTheDocument();
  });

  it('renders children when loading', () => {
    render(
      <LoadingOverlay loading={true}>
        <div data-testid="child-content">{childText}</div>
      </LoadingOverlay>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText(childText)).toBeInTheDocument();
    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
  });

  it('displays the default message when loading', () => {
    render(
      <LoadingOverlay loading={true}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
  });

  it('displays a custom message when provided and loading', () => {
    render(
      <LoadingOverlay loading={true} message={customMessage}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.queryByText(defaultMessage)).not.toBeInTheDocument();
  });

  it('does not display any message when not loading', () => {
    render(
      <LoadingOverlay loading={false} message="Custom loading message">
        <div>{childText}</div>
      </LoadingOverlay>
    );

    expect(screen.queryByText('Custom loading message')).not.toBeInTheDocument();
    expect(screen.queryByText(defaultMessage)).not.toBeInTheDocument();
  });

  it('applies the correct CSS classes when loading', () => {
    render(
      <LoadingOverlay loading={true}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    const overlay = screen.getByText(defaultMessage).parentElement;
    expect(overlay).toHaveClass('loadingOverlay');
    expect(overlay).not.toHaveClass('loadingOverlayHidden');
  });

  it('applies the correct CSS classes when not loading', () => {
    render(
      <LoadingOverlay loading={false}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    // Find the overlay div directly since there's no text
    const overlay = document.querySelector('.loadingOverlay');
    expect(overlay).toHaveClass('loadingOverlayHidden');
  });

  it('sets correct aria attributes when loading', () => {
    render(
      <LoadingOverlay loading={true}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    const overlay = screen.getByText(defaultMessage).parentElement;
    expect(overlay).toHaveAttribute('aria-hidden', 'false');
    expect(overlay).toHaveAttribute('aria-live', 'polite');
  });

  it('sets correct aria attributes when not loading', () => {
    render(
      <LoadingOverlay loading={false}>
        <div>{childText}</div>
      </LoadingOverlay>
    );

    // Find the overlay div directly
    const overlay = document.querySelector('.loadingOverlay');
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