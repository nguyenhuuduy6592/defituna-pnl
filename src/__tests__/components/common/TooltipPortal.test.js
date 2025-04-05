import React, { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TooltipPortal } from '../../../components/common/TooltipPortal';

// Mock createPortal to make it testable
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node) => node, // Return the children directly without the portal
}));

// Mock the TooltipPortal styles
jest.mock('../../../components/common/TooltipPortal.module.scss', () => ({
  tooltipContainer: 'tooltipContainer',
  tooltip: 'tooltip',
  top: 'top',
  bottom: 'bottom'
}));

// Mock window scroll/resize events
const mockAddEventListener = jest.spyOn(window, 'addEventListener');
const mockRemoveEventListener = jest.spyOn(window, 'removeEventListener');

// Setup fake getBoundingClientRect and scroll values
const mockRect = {
  top: 100,
  left: 200,
  width: 50,
  height: 30
};

describe('TooltipPortal Component', () => {
  let targetRef;

  beforeEach(() => {
    // Setup DOM appendChild/removeChild mock
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    
    // Setup target ref with mock getBoundingClientRect
    targetRef = {
      current: {
        getBoundingClientRect: jest.fn().mockReturnValue(mockRect)
      }
    };
    
    // Mock scroll position
    window.scrollX = 0;
    window.scrollY = 0;
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
    
    // Clear all mocks
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('creates a portal container when mounted', () => {
    render(
      <TooltipPortal targetRef={targetRef} show={true}>
        Tooltip content
      </TooltipPortal>
    );
    
    expect(document.body.appendChild).toHaveBeenCalled();
  });
  
  it('cleans up portal container on unmount', () => {
    const { unmount } = render(
      <TooltipPortal targetRef={targetRef} show={true}>
        Tooltip content
      </TooltipPortal>
    );
    
    unmount();
    
    expect(document.body.removeChild).toHaveBeenCalled();
  });
  
  it('renders tooltip content when show is true', () => {
    render(
      <TooltipPortal targetRef={targetRef} show={true}>
        Tooltip content
      </TooltipPortal>
    );
    
    expect(screen.getByText('Tooltip content')).toBeInTheDocument();
  });
  
  it('does not render tooltip content when show is false', () => {
    render(
      <TooltipPortal targetRef={targetRef} show={false}>
        Tooltip content
      </TooltipPortal>
    );
    
    expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
  });
  
  it('positions the tooltip based on target element', () => {
    render(
      <TooltipPortal targetRef={targetRef} show={true} position="top">
        Tooltip content
      </TooltipPortal>
    );
    
    const tooltipContainer = screen.getByRole('tooltip');
    expect(tooltipContainer).toHaveStyle({
      position: 'absolute',
      // top value should be target's top minus some spacing (10px)
      top: `${mockRect.top - 10}px`,
      // left value should be target's left plus half its width
      left: `${mockRect.left + mockRect.width / 2}px`
    });
  });
  
  it('applies different positioning for bottom position', () => {
    render(
      <TooltipPortal targetRef={targetRef} show={true} position="bottom">
        Tooltip content
      </TooltipPortal>
    );
    
    const tooltipContainer = screen.getByRole('tooltip');
    expect(tooltipContainer).toHaveStyle({
      // top value should be target's top + height + some spacing (10px)
      top: `${mockRect.top + mockRect.height + 10}px`
    });
  });
  
  it('applies the correct position class', () => {
    const { rerender } = render(
      <TooltipPortal targetRef={targetRef} show={true} position="top">
        Tooltip content
      </TooltipPortal>
    );
    
    let tooltipElement = screen.getByText('Tooltip content').closest('.tooltip');
    expect(tooltipElement).toHaveClass('top');
    
    rerender(
      <TooltipPortal targetRef={targetRef} show={true} position="bottom">
        Tooltip content
      </TooltipPortal>
    );
    
    tooltipElement = screen.getByText('Tooltip content').closest('.tooltip');
    expect(tooltipElement).toHaveClass('bottom');
  });
  
  it('sets up scroll and resize event listeners when visible', () => {
    render(
      <TooltipPortal targetRef={targetRef} show={true}>
        Tooltip content
      </TooltipPortal>
    );
    
    expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
  
  it('removes event listeners when hidden or unmounted', () => {
    const { rerender, unmount } = render(
      <TooltipPortal targetRef={targetRef} show={true}>
        Tooltip content
      </TooltipPortal>
    );
    
    rerender(
      <TooltipPortal targetRef={targetRef} show={false}>
        Tooltip content
      </TooltipPortal>
    );
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    
    mockRemoveEventListener.mockClear();
    
    unmount();
    
    // Should be called when unmounted even if already hidden
    expect(mockRemoveEventListener).toHaveBeenCalledTimes(0);
  });
  
  it('sets correct ARIA attributes', () => {
    render(
      <TooltipPortal targetRef={targetRef} show={true}>
        Tooltip content
      </TooltipPortal>
    );
    
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('aria-live', 'polite');
  });
  
  it('updates position when target ref changes', () => {
    const newMockRect = {
      top: 200,
      left: 300,
      width: 60,
      height: 40
    };
    
    render(
      <TooltipPortal targetRef={targetRef} show={true}>
        Tooltip content
      </TooltipPortal>
    );
    
    // Initial position
    let tooltipContainer = screen.getByRole('tooltip');
    expect(tooltipContainer).toHaveStyle({
      top: `${mockRect.top - 10}px`,
      left: `${mockRect.left + mockRect.width / 2}px`
    });
    
    // Change the rect value returned by getBoundingClientRect
    targetRef.current.getBoundingClientRect.mockReturnValue(newMockRect);
    
    // Simulate scroll event to trigger position update
    window.dispatchEvent(new Event('scroll'));
    
    // Position should be updated
    expect(tooltipContainer).toHaveStyle({
      top: `${newMockRect.top - 10}px`,
      left: `${newMockRect.left + newMockRect.width / 2}px`
    });
  });
}); 