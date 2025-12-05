import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DisclaimerModal } from '../../../components/common/DisclaimerModal';

// Mock HiX icon component
jest.mock('react-icons/hi', () => ({
  HiX: () => <div data-testid="close-icon">X Icon</div>,
}));

// Mock the styles
jest.mock('../../../components/common/DisclaimerModal.module.scss', () => ({
  overlay: 'overlay',
  modal: 'modal',
  header: 'header',
  closeButton: 'closeButton',
  content: 'content',
  actions: 'actions',
  confirmButton: 'confirmButton',
  section: 'section',
}));

describe('DisclaimerModal Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    // Mock focus method for ref
    jest
      .spyOn(HTMLButtonElement.prototype, 'focus')
      .mockImplementation(() => {});
    // Mock document event listeners
    jest.spyOn(document, 'addEventListener').mockImplementation(() => {});
    jest.spyOn(document, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<DisclaimerModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Project Disclaimer')).not.toBeInTheDocument();
  });

  it('renders the modal when isOpen is true', () => {
    render(<DisclaimerModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Project Disclaimer')).toBeInTheDocument();
    expect(screen.getByText('Defituna PnL Viewer')).toBeInTheDocument();
    expect(screen.getByText('Development Status')).toBeInTheDocument();
    expect(screen.getByText('Data & Privacy')).toBeInTheDocument();
    expect(screen.getByText('Contact & Support')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<DisclaimerModal isOpen={true} onClose={mockOnClose} />);

    // Use a more specific query to find the close button
    const closeButton = screen.getByTestId('close-icon').closest('button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the "I Understand" button is clicked', () => {
    render(<DisclaimerModal isOpen={true} onClose={mockOnClose} />);

    // Use a more specific query to find the confirm button
    const confirmButton = screen.getByText('I Understand');
    fireEvent.click(confirmButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the overlay (backdrop)', () => {
    render(<DisclaimerModal isOpen={true} onClose={mockOnClose} />);

    const overlay = screen.getByRole('dialog');
    // Simulate clicking the overlay itself, not its children
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking the modal content', () => {
    render(<DisclaimerModal isOpen={true} onClose={mockOnClose} />);

    const modalContent = screen
      .getByText('Project Disclaimer')
      .closest('.modal');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<DisclaimerModal isOpen={true} onClose={mockOnClose} />);

    // Verify that event listener was added
    expect(document.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );

    // Get the event handler
    const keydownHandler = document.addEventListener.mock.calls.find(
      (call) => call[0] === 'keydown'
    )[1];

    // Simulate Escape key press
    keydownHandler({ key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('focuses the close button when the modal opens', () => {
    render(<DisclaimerModal isOpen={true} onClose={mockOnClose} />);

    // Check that focus was called (we can't test if it was called on the right element)
    expect(HTMLButtonElement.prototype.focus).toHaveBeenCalled();
  });

  it('removes keydown event listener when the modal closes', () => {
    const { rerender } = render(
      <DisclaimerModal isOpen={true} onClose={mockOnClose} />
    );

    expect(document.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );

    rerender(<DisclaimerModal isOpen={false} onClose={mockOnClose} />);

    expect(document.removeEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });

  it('sets proper accessibility attributes', () => {
    render(<DisclaimerModal isOpen={true} onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'disclaimer-title');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Use more specific queries for the buttons
    const closeButton = screen.getByTestId('close-icon').closest('button');
    expect(closeButton).toHaveAttribute('aria-label', 'Close');

    const confirmButton = screen.getByText('I Understand');
    expect(confirmButton).toHaveAttribute('aria-label', 'Close disclaimer');
  });

  // Test for the DisclaimerSection subcomponent
  it('renders disclaimer sections with titles and content', () => {
    render(<DisclaimerModal isOpen={true} onClose={mockOnClose} />);

    // Check that sections exist
    const developmentSection = screen
      .getByText('Development Status')
      .closest('.section');
    const dataPrivacySection = screen
      .getByText('Data & Privacy')
      .closest('.section');
    const contactSection = screen
      .getByText('Contact & Support')
      .closest('.section');

    expect(developmentSection).toBeInTheDocument();
    expect(dataPrivacySection).toBeInTheDocument();
    expect(contactSection).toBeInTheDocument();

    // Check content in sections
    expect(screen.getByText(/This is a personal project/)).toBeInTheDocument();
    expect(
      screen.getByText(/I do not collect any user data/)
    ).toBeInTheDocument();
    expect(screen.getByText(/@DuyNguyenM2E/)).toBeInTheDocument();
  });
});
