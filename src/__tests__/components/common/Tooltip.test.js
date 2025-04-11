import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tooltip } from '@/components/common/Tooltip';

// Mock the Tooltip module SCSS
jest.mock('@/components/common/Tooltip.module.scss', () => ({
  tooltipContainer: 'tooltipContainer',
  tooltipTrigger: 'tooltipTrigger',
  tooltip: 'tooltip',
  active: 'active',
  visible: 'visible',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  'top-center': 'top-center',
  'bottom-center': 'bottom-center',
  'right-center': 'right-center',
  'left-center': 'left-center'
}));

describe('Tooltip Component', () => {
  beforeEach(() => {
    // Mock document event listeners
    jest.spyOn(document, 'addEventListener').mockImplementation(() => {});
    jest.spyOn(document, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the trigger element', () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip content when clicked', () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Click me</button>
      </Tooltip>
    );

    // Click the trigger
    fireEvent.click(screen.getByText('Click me'));

    // Tooltip should now be visible (with the visible class)
    const tooltip = screen.getByText('Tooltip content').closest('.tooltip');
    expect(tooltip).toHaveClass('visible');
  });

  it('toggles tooltip visibility on click', () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Toggle me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Toggle me');
    
    // First click - show tooltip
    fireEvent.click(trigger);
    let tooltip = screen.getByText('Tooltip content').closest('.tooltip');
    expect(tooltip).toHaveClass('visible');

    // Second click - hide tooltip
    fireEvent.click(trigger);
    tooltip = screen.getByText('Tooltip content').closest('.tooltip');
    expect(tooltip).not.toHaveClass('visible');
  });

  it('applies the correct position class', () => {
    const { rerender } = render(
      <Tooltip content="Content" position="top">
        <button>Trigger</button>
      </Tooltip>
    );

    // Click to show tooltip
    fireEvent.click(screen.getByText('Trigger'));
    
    // Check for top position class
    let tooltip = screen.getByText('Content').closest('.tooltip');
    expect(tooltip).toHaveClass('top');

    // Rerender with bottom position
    rerender(
      <Tooltip content="Content" position="bottom">
        <button>Trigger</button>
      </Tooltip>
    );

    // Click to show tooltip
    fireEvent.click(screen.getByText('Trigger'));
    
    // Check for bottom position class
    tooltip = screen.getByText('Content').closest('.tooltip');
    expect(tooltip).toHaveClass('bottom');
  });

  it('handles invalid position by defaulting to bottom', () => {
    render(
      <Tooltip content="Content" position="invalid-position">
        <button>Trigger</button>
      </Tooltip>
    );

    // Click to show tooltip
    fireEvent.click(screen.getByText('Trigger'));
    
    // Should default to bottom
    const tooltip = screen.getByText('Content').closest('.tooltip');
    expect(tooltip).toHaveClass('bottom');
  });

  it('applies aria attributes correctly', () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Accessibility</button>
      </Tooltip>
    );

    // Get trigger element
    const trigger = screen.getByText('Accessibility').closest('.tooltipTrigger');
    
    // Initial state
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    
    // After click
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    
    // Tooltip should have correct role
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('sets up event listeners when visible', () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Click me</button>
      </Tooltip>
    );

    // Click to show tooltip
    fireEvent.click(screen.getByText('Click me'));
    
    // Document event listeners should be added when tooltip is visible
    expect(document.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
  });

  it('removes event listeners when hidden', () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Click me</button>
      </Tooltip>
    );

    // Click to show tooltip
    fireEvent.click(screen.getByText('Click me'));
    
    // Click again to hide tooltip
    fireEvent.click(screen.getByText('Click me'));
    
    // Document event listeners should be removed
    expect(document.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
  });
}); 