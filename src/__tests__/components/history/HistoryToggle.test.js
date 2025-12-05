import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HistoryToggle } from '../../../components/history/HistoryToggle';

// Mock the HistoryConfirmationModal component
jest.mock('../../../components/history/HistoryConfirmationModal', () => ({
  HistoryConfirmationModal: ({ onConfirm, onCancel, isEnabling }) => (
    <div data-testid="confirmation-modal" data-is-enabling={isEnabling}>
      <button data-testid="confirm-button" onClick={onConfirm}>Confirm</button>
      <button data-testid="cancel-button" onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('HistoryToggle Component', () => {
  const mockOnToggle = jest.fn();
  const mockSetAutoRefresh = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
    mockSetAutoRefresh.mockClear();
  });

  it('renders the toggle with correct state when disabled', () => {
    render(
      <HistoryToggle
        enabled={false}
        onToggle={mockOnToggle}
        setAutoRefresh={mockSetAutoRefresh}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /Enable historical data storage/i });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText('Store History')).toBeInTheDocument();
  });

  it('renders the toggle with correct state when enabled', () => {
    render(
      <HistoryToggle
        enabled={true}
        onToggle={mockOnToggle}
        setAutoRefresh={mockSetAutoRefresh}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /Enable historical data storage/i });
    expect(checkbox).toBeChecked();
  });

  it('shows confirmation modal when toggle is clicked', () => {
    render(
      <HistoryToggle
        enabled={false}
        onToggle={mockOnToggle}
        setAutoRefresh={mockSetAutoRefresh}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    expect(screen.getByTestId('confirmation-modal')).toHaveAttribute('data-is-enabling', 'true');
  });

  it('calls onToggle with true and enables auto-refresh when confirmed enable', () => {
    render(
      <HistoryToggle
        enabled={false}
        onToggle={mockOnToggle}
        setAutoRefresh={mockSetAutoRefresh}
      />
    );

    // Click the toggle to enable
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Confirm the change
    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    expect(mockOnToggle).toHaveBeenCalledWith(true);
    expect(mockSetAutoRefresh).toHaveBeenCalledWith(true);
  });

  it('calls onToggle with false when confirmed disable', () => {
    render(
      <HistoryToggle
        enabled={true}
        onToggle={mockOnToggle}
        setAutoRefresh={mockSetAutoRefresh}
      />
    );

    // Click the toggle to disable
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Confirm the change
    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    expect(mockOnToggle).toHaveBeenCalledWith(false);
    // Auto-refresh should not be enabled when disabling history
    expect(mockSetAutoRefresh).not.toHaveBeenCalledWith(true);
  });

  it('does not call callbacks when cancel is clicked', () => {
    render(
      <HistoryToggle
        enabled={false}
        onToggle={mockOnToggle}
        setAutoRefresh={mockSetAutoRefresh}
      />
    );

    // Click the toggle
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Cancel the change
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    expect(mockOnToggle).not.toHaveBeenCalled();
    expect(mockSetAutoRefresh).not.toHaveBeenCalled();
  });
});