import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from '../ConfirmationModal';

// Mock the HiX icon component
jest.mock('react-icons/hi', () => ({
  HiX: () => <div data-testid="close-icon">X</div>
}));

describe('ConfirmationModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Test Title',
    message: 'Test Message'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<ConfirmationModal {...mockProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal content when isOpen is true', () => {
    render(<ConfirmationModal {...mockProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('calls onClose when clicking the close button', () => {
    render(<ConfirmationModal {...mockProps} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the overlay', () => {
    render(<ConfirmationModal {...mockProps} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape key', () => {
    render(<ConfirmationModal {...mockProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when clicking Confirm button', () => {
    render(<ConfirmationModal {...mockProps} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking Cancel button', () => {
    render(<ConfirmationModal {...mockProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<ConfirmationModal {...mockProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirmation-title');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByLabelText('Close')).toHaveAttribute('title', 'Close confirmation');
    expect(screen.getByLabelText('Cancel action')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm action')).toBeInTheDocument();
  });

  it('focuses on close button when opened', () => {
    render(<ConfirmationModal {...mockProps} />);
    expect(screen.getByLabelText('Close')).toHaveFocus();
  });

  it('removes event listener when unmounted', () => {
    const { unmount } = render(<ConfirmationModal {...mockProps} />);
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
}); 