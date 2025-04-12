import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AutoRefresh } from '@/components/pnl/AutoRefresh';

// Mock the HistoryToggle component
jest.mock('@/components/history/HistoryToggle', () => ({
  HistoryToggle: ({ enabled, onToggle, setAutoRefresh }) => (
    <div 
      data-testid="history-toggle-mock" 
      data-enabled={enabled.toString()}
      onClick={() => onToggle(!enabled)}
    >
      History Toggle Mock
    </div>
  )
}));

// Mock styles
jest.mock('@/styles/AutoRefresh.module.scss', () => ({
  refreshControls: 'refreshControls-mock',
  refreshToggles: 'refreshToggles-mock',
  refreshToggle: 'refreshToggle-mock',
  intervalSelector: 'intervalSelector-mock',
  refreshStatus: 'refreshStatus-mock'
}));

describe('AutoRefresh Component', () => {
  const defaultProps = {
    autoRefresh: false,
    setAutoRefresh: jest.fn(),
    refreshInterval: 60,
    onIntervalChange: jest.fn(),
    autoRefreshCountdown: 30,
    loading: false,
    historyEnabled: false,
    onHistoryToggle: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with auto-refresh disabled', () => {
    render(<AutoRefresh {...defaultProps} />);
    
    // Check for main elements
    expect(screen.getByText('Auto-refresh')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByTestId('history-toggle-mock')).toBeInTheDocument();
    
    // Interval selector and refresh status should not be visible
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText(/Next refresh in/)).not.toBeInTheDocument();
  });

  it('renders with auto-refresh enabled', () => {
    render(<AutoRefresh {...defaultProps} autoRefresh={true} />);
    
    // Check for main elements
    expect(screen.getByText('Auto-refresh')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
    
    // Interval selector and refresh status should be visible
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/Next refresh in 30 seconds/)).toBeInTheDocument();
  });

  it('calls setAutoRefresh when checkbox is toggled', () => {
    render(<AutoRefresh {...defaultProps} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(defaultProps.setAutoRefresh).toHaveBeenCalledWith(true);
  });

  it('calls onIntervalChange when interval is changed', () => {
    render(<AutoRefresh {...defaultProps} autoRefresh={true} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '300' } });
    
    expect(defaultProps.onIntervalChange).toHaveBeenCalled();
  });

  it('renders different refresh status when loading', () => {
    render(<AutoRefresh {...defaultProps} autoRefresh={true} loading={true} />);
    
    expect(screen.getByText('Refreshing data...')).toBeInTheDocument();
    expect(screen.queryByText(/Next refresh in/)).not.toBeInTheDocument();
  });

  it('applies correct className to root element', () => {
    const { container } = render(<AutoRefresh {...defaultProps} />);
    const rootElement = container.firstChild;
    
    expect(rootElement).toHaveClass('refreshControls-mock');
  });

  it('passes correct props to HistoryToggle', () => {
    render(<AutoRefresh {...defaultProps} historyEnabled={true} />);
    
    const historyToggle = screen.getByTestId('history-toggle-mock');
    expect(historyToggle).toHaveAttribute('data-enabled', 'true');
    
    // Test the onToggle handler
    fireEvent.click(historyToggle);
    expect(defaultProps.onHistoryToggle).toHaveBeenCalledWith(false);
  });

  it('handles interval change correctly', () => {
    render(<AutoRefresh {...defaultProps} autoRefresh={true} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('60');
    
    fireEvent.change(select, { target: { value: '300' } });
    expect(defaultProps.onIntervalChange).toHaveBeenCalled();
  });

  describe('IntervalSelector subcomponent', () => {
    it('renders the correct options', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Test production environment (no 5 second option)
      process.env.NODE_ENV = 'production';
      render(<AutoRefresh {...defaultProps} autoRefresh={true} />);
      
      const selectProd = screen.getByRole('combobox');
      const optionsProd = Array.from(selectProd.children).map(option => option.value);
      expect(optionsProd).toEqual(['30', '60', '300']);
      expect(optionsProd).not.toContain('5');
      
      // Cleanup
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('includes 10 second option in development', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Test development environment (includes 10 second option)
      process.env.NODE_ENV = 'development';
      render(<AutoRefresh {...defaultProps} autoRefresh={true} />);
      
      const selectDev = screen.getByRole('combobox');
      const optionsDev = Array.from(selectDev.children).map(option => option.value);
      expect(optionsDev).toEqual(['10', '30', '60', '300']);
      
      // Cleanup
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('sets appropriate aria attributes for accessibility', () => {
      render(<AutoRefresh {...defaultProps} autoRefresh={true} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label', 'Select refresh interval');
      expect(select).toHaveAttribute('title', 'Select how often to refresh the data');
    });
  });

  describe('RefreshStatus subcomponent', () => {
    it('displays countdown when not loading', () => {
      render(
        <AutoRefresh 
          {...defaultProps} 
          autoRefresh={true} 
          loading={false}
          autoRefreshCountdown={45}
        />
      );
      
      expect(screen.getByText('Next refresh in 45 seconds')).toBeInTheDocument();
    });

    it('displays loading message when loading', () => {
      render(
        <AutoRefresh 
          {...defaultProps} 
          autoRefresh={true} 
          loading={true}
        />
      );
      
      expect(screen.getByText('Refreshing data...')).toBeInTheDocument();
    });
  });
}); 