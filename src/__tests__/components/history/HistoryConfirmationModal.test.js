import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HistoryConfirmationModal } from '@/components/history/HistoryConfirmationModal';

// Mock react-icons
jest.mock('react-icons/hi', () => ({
  HiX: () => <div data-testid="close-icon">X</div>,
}));

describe('HistoryConfirmationModal Component', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Enable mode', () => {
    beforeEach(() => {
      render(
        <HistoryConfirmationModal 
          onConfirm={mockOnConfirm} 
          onCancel={mockOnCancel} 
          isEnabling={true}
        />
      );
    });

    it('renders the enable modal with correct title', () => {
      expect(screen.getByText('Enable Historical Data Storage')).toBeInTheDocument();
    });

    it('renders enable-specific content', () => {
      expect(screen.getByText(/This feature will store your position data locally/)).toBeInTheDocument();
      expect(screen.getByText('Historical performance chart')).toBeInTheDocument();
    });

    it('renders important notes for enabling', () => {
      expect(screen.getByText('Important notes:')).toBeInTheDocument();
      expect(screen.getByText(/Auto-refresh will be enabled/)).toBeInTheDocument();
      expect(screen.getByText(/The browser tab must be open/)).toBeInTheDocument();
    });

    it('shows correct confirm button text', () => {
      expect(screen.getByRole('button', { name: /Enable historical data storage/i })).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', () => {
      const confirmButton = screen.getByRole('button', { name: /Enable historical data storage/i });
      fireEvent.click(confirmButton);
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disable mode', () => {
    beforeEach(() => {
      render(
        <HistoryConfirmationModal 
          onConfirm={mockOnConfirm} 
          onCancel={mockOnCancel} 
          isEnabling={false}
        />
      );
    });

    it('renders the disable modal with correct title', () => {
      expect(screen.getByText('Disable Historical Data Storage')).toBeInTheDocument();
    });

    it('renders disable-specific content', () => {
      expect(screen.getByText(/Disabling historical data storage will:/)).toBeInTheDocument();
      expect(screen.getByText(/Stop collecting new position data/)).toBeInTheDocument();
      expect(screen.getByText(/Remove access to historical performance charts/)).toBeInTheDocument();
    });

    it('renders important notes for disabling', () => {
      expect(screen.getByText('Important notes:')).toBeInTheDocument();
      expect(screen.getByText(/You can re-enable this feature/)).toBeInTheDocument();
      expect(screen.getByText(/Existing data will be preserved/)).toBeInTheDocument();
    });

    it('shows correct confirm button text', () => {
      expect(screen.getByRole('button', { name: /Disable historical data storage/i })).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', () => {
      const confirmButton = screen.getByRole('button', { name: /Disable historical data storage/i });
      fireEvent.click(confirmButton);
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <HistoryConfirmationModal 
        onConfirm={mockOnConfirm} 
        onCancel={mockOnCancel} 
        isEnabling={true}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when close button is clicked', () => {
    render(
      <HistoryConfirmationModal 
        onConfirm={mockOnConfirm} 
        onCancel={mockOnCancel} 
        isEnabling={true}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
  
  it('calls onCancel when Escape key is pressed', () => {
    render(
      <HistoryConfirmationModal 
        onConfirm={mockOnConfirm} 
        onCancel={mockOnCancel} 
        isEnabling={true}
      />
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when clicking on the overlay', () => {
    render(
      <HistoryConfirmationModal 
        onConfirm={mockOnConfirm} 
        onCancel={mockOnCancel} 
        isEnabling={true}
      />
    );
    
    const overlay = screen.getByRole('dialog');
    // Click the overlay itself (not its children)
    fireEvent.click(overlay);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(
      <HistoryConfirmationModal 
        onConfirm={mockOnConfirm} 
        onCancel={mockOnCancel} 
        isEnabling={true}
      />
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });
}); 