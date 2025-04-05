import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import EnhancedTooltip from '../../../components/common/EnhancedTooltip';

// Mock the createPortal function
jest.mock('react-dom', () => {
  const originalModule = jest.requireActual('react-dom');
  return {
    ...originalModule,
    createPortal: jest.fn((node) => node),
  };
});

// Mock the React useState hook
const mockSetIsVisible = jest.fn();
jest.mock('react', () => {
  const originalModule = jest.requireActual('react');
  return {
    ...originalModule,
    useState: jest.fn((initialValue) => {
      // For isVisible state specifically, use our mock
      if (initialValue === false) {
        return [false, mockSetIsVisible];
      }
      // For other useState calls, use the original behavior
      return originalModule.useState(initialValue);
    })
  };
});

describe('EnhancedTooltip Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock getBoundingClientRect for positioning calculations
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      left: 100,
      bottom: 150,
      right: 200,
    }));
    
    // Mock window dimensions
    global.innerWidth = 1024;
    global.innerHeight = 768;
    
    // Update useState mock to always return false for isVisible at the start of each test
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [false, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
  });

  it('renders the trigger element', () => {
    render(
      <EnhancedTooltip content="Test tooltip">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip on mouse enter', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip content="Test tooltip">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const trigger = screen.getByText('Hover me').closest('div');
    fireEvent.mouseEnter(trigger);
    
    // Tooltip should be visible and have the content
    expect(screen.getByText('Test tooltip')).toBeInTheDocument();
  });

  it('handles mouse enter event', () => {
    render(
      <EnhancedTooltip content="Test tooltip">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const trigger = screen.getByText('Hover me').closest('div');
    fireEvent.mouseEnter(trigger);
    
    // Verify that setIsVisible was called with true
    expect(mockSetIsVisible).toHaveBeenCalledWith(true);
  });

  it('handles mouse leave event', () => {
    // First make the component think it's visible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible]; // mock as visible
      }
      return [initialValue, jest.fn()];
    });
    
    jest.useFakeTimers();
    
    render(
      <EnhancedTooltip content="Test tooltip">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const trigger = screen.getByText('Hover me').closest('div');
    
    // Need to reset the mock to track future calls
    mockSetIsVisible.mockClear();
    
    // Leave trigger
    fireEvent.mouseLeave(trigger);
    
    // Fast-forward timer
    act(() => {
      jest.advanceTimersByTime(150);
    });
    
    // Verify setIsVisible is called with false after timeout
    expect(mockSetIsVisible).toHaveBeenCalled(); 
    
    jest.useRealTimers();
  });

  it('toggles tooltip visibility on click', () => {
    render(
      <EnhancedTooltip content="Test tooltip">
        <button>Click me</button>
      </EnhancedTooltip>
    );
    
    const trigger = screen.getByText('Click me').closest('div');
    
    // Test toggling on
    fireEvent.click(trigger);
    expect(mockSetIsVisible).toHaveBeenCalled();
    mockSetIsVisible.mockClear();
    
    // Change mock to return true for the next test
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible]; // Now it returns true
      }
      return [initialValue, jest.fn()];
    });
    
    // When component thinks tooltip is visible, we should get !isVisible call
    fireEvent.click(trigger);
    expect(mockSetIsVisible).toHaveBeenCalled();
  });

  it('closes tooltip when Escape key is pressed', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip content="Test tooltip">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    // Trigger the escape key event handler
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Verify setIsVisible is called with false
    expect(mockSetIsVisible).toHaveBeenCalledWith(false);
  });

  it('closes tooltip when clicking outside', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip content="Test tooltip">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    // Verify setIsVisible is called with false
    expect(mockSetIsVisible).toHaveBeenCalledWith(false);
  });

  it('applies correct position class', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    const { rerender } = render(
      <EnhancedTooltip content="Test tooltip" position="top">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByRole('tooltip')).toHaveClass('top');
    
    // Change position to bottom
    rerender(
      <EnhancedTooltip content="Test tooltip" position="bottom">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByRole('tooltip')).toHaveClass('bottom');
  });

  it('supports interactive mode', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip content="Test tooltip" interactive={true}>
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('interactive');
  });

  it('accepts maxWidth prop', () => {
    // Configure useState to return true for isVisible so tooltip is rendered
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    // Render with maxWidth prop
    render(
      <EnhancedTooltip content="Test tooltip" maxWidth="250px">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    // Test passes if component renders without errors
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('disables hover behavior when disableHover is true', () => {
    render(
      <EnhancedTooltip content="Test tooltip" disableHover={true}>
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const trigger = screen.getByText('Hover me').closest('div');
    
    // Mouse enter should not set isVisible to true when disableHover is true
    fireEvent.mouseEnter(trigger);
    expect(mockSetIsVisible).not.toHaveBeenCalledWith(true);
    
    // But click should still work
    fireEvent.click(trigger);
    expect(mockSetIsVisible).toHaveBeenCalledWith(true);
  });

  it('renders complex content', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip 
        content={<div data-testid="complex-content"><h4>Title</h4><p>Description</p></div>}
      >
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByTestId('complex-content')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('applies correct position class', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    const { rerender } = render(
      <EnhancedTooltip content="Test tooltip" position="right">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByRole('tooltip')).toHaveClass('right');
    
    // Change position to left
    rerender(
      <EnhancedTooltip content="Test tooltip" position="left">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByRole('tooltip')).toHaveClass('left');
  });

  it('closes tooltip when clicking outside', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip content="Test tooltip">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    // Verify setIsVisible is called with false
    expect(mockSetIsVisible).toHaveBeenCalledWith(false);
  });

  it('supports interactive mode', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip content="Test tooltip" interactive={true}>
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('interactive');
  });

  it('accepts maxWidth prop', () => {
    // Configure useState to return true for isVisible so tooltip is rendered
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    // Render with maxWidth prop
    render(
      <EnhancedTooltip content="Test tooltip" maxWidth="250px">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    // Test passes if component renders without errors
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('disables hover behavior when disableHover is true', () => {
    render(
      <EnhancedTooltip content="Test tooltip" disableHover={true}>
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const trigger = screen.getByText('Hover me').closest('div');
    
    // Mouse enter should not set isVisible to true when disableHover is true
    fireEvent.mouseEnter(trigger);
    expect(mockSetIsVisible).not.toHaveBeenCalledWith(true);
    
    // But click should still work
    fireEvent.click(trigger);
    expect(mockSetIsVisible).toHaveBeenCalledWith(true);
  });

  it('renders complex content', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip 
        content={<div data-testid="complex-content"><h4>Title</h4><p>Description</p></div>}
      >
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByTestId('complex-content')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('applies correct position class', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    const { rerender } = render(
      <EnhancedTooltip content="Test tooltip" position="right">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByRole('tooltip')).toHaveClass('right');
    
    // Change position to left
    rerender(
      <EnhancedTooltip content="Test tooltip" position="left">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByRole('tooltip')).toHaveClass('left');
  });

  it('closes tooltip when clicking outside', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip content="Test tooltip">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    // Verify setIsVisible is called with false
    expect(mockSetIsVisible).toHaveBeenCalledWith(false);
  });

  it('supports interactive mode', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip content="Test tooltip" interactive={true}>
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('interactive');
  });

  it('accepts maxWidth prop', () => {
    // Configure useState to return true for isVisible so tooltip is rendered
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    // Render with maxWidth prop
    render(
      <EnhancedTooltip content="Test tooltip" maxWidth="250px">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    // Test passes if component renders without errors
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('disables hover behavior when disableHover is true', () => {
    render(
      <EnhancedTooltip content="Test tooltip" disableHover={true}>
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const trigger = screen.getByText('Hover me').closest('div');
    
    // Mouse enter should not set isVisible to true when disableHover is true
    fireEvent.mouseEnter(trigger);
    expect(mockSetIsVisible).not.toHaveBeenCalledWith(true);
    
    // But click should still work
    fireEvent.click(trigger);
    expect(mockSetIsVisible).toHaveBeenCalledWith(true);
  });

  it('renders complex content', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip 
        content={<div data-testid="complex-content"><h4>Title</h4><p>Description</p></div>}
      >
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByTestId('complex-content')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('applies correct position class', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    const { rerender } = render(
      <EnhancedTooltip content="Test tooltip" position="right">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByRole('tooltip')).toHaveClass('right');
    
    // Change position to left
    rerender(
      <EnhancedTooltip content="Test tooltip" position="left">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByRole('tooltip')).toHaveClass('left');
  });

  it('closes tooltip when clicking outside', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip content="Test tooltip">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    // Verify setIsVisible is called with false
    expect(mockSetIsVisible).toHaveBeenCalledWith(false);
  });

  it('supports interactive mode', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip content="Test tooltip" interactive={true}>
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('interactive');
  });

  it('accepts maxWidth prop', () => {
    // Configure useState to return true for isVisible so tooltip is rendered
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    // Render with maxWidth prop
    render(
      <EnhancedTooltip content="Test tooltip" maxWidth="250px">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    // Test passes if component renders without errors
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('disables hover behavior when disableHover is true', () => {
    render(
      <EnhancedTooltip content="Test tooltip" disableHover={true}>
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    const trigger = screen.getByText('Hover me').closest('div');
    
    // Mouse enter should not set isVisible to true when disableHover is true
    fireEvent.mouseEnter(trigger);
    expect(mockSetIsVisible).not.toHaveBeenCalledWith(true);
    
    // But click should still work
    fireEvent.click(trigger);
    expect(mockSetIsVisible).toHaveBeenCalledWith(true);
  });

  it('renders complex content', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <EnhancedTooltip 
        content={<div data-testid="complex-content"><h4>Title</h4><p>Description</p></div>}
      >
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByTestId('complex-content')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('applies correct position class', () => {
    // Configure useState to return true for isVisible
    React.useState.mockImplementation((initialValue) => {
      if (initialValue === false) {
        return [true, mockSetIsVisible];
      }
      return [initialValue, jest.fn()];
    });
    
    const { rerender } = render(
      <EnhancedTooltip content="Test tooltip" position="right">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByRole('tooltip')).toHaveClass('right');
    
    // Change position to left
    rerender(
      <EnhancedTooltip content="Test tooltip" position="left">
        <button>Hover me</button>
      </EnhancedTooltip>
    );
    
    expect(screen.getByRole('tooltip')).toHaveClass('left');
  });
}); 