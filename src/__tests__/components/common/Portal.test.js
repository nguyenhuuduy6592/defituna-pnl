import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Portal } from '../../../components/common/Portal';

// Set up fake timers
jest.useFakeTimers();

// Mock createPortal to make it testable
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node) => node, // Return the children directly without the portal
}));

describe('Portal Component', () => {
  beforeEach(() => {
    // Spy on document.body appendChild/removeChild to verify proper portal creation
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up
    jest.restoreAllMocks();
  });

  it('creates a portal container when mounted', () => {
    render(<Portal>Test content</Portal>);
    
    // Initially, the useEffect hasn't run yet
    expect(document.body.appendChild).not.toHaveBeenCalled();
    
    // Run timers to let the useEffect run
    jest.runAllTimers();
    
    // After useEffect, should have created the portal
    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it('cleans up portal container on unmount', () => {
    const { unmount } = render(<Portal>Test content</Portal>);
    
    // Run timers to let the useEffect run
    jest.runAllTimers();
    
    // Should have created a portal
    expect(document.body.appendChild).toHaveBeenCalled();
    
    // Reset the mock to clear the call count
    document.body.appendChild.mockClear();
    document.body.removeChild.mockClear();
    
    // Unmount the component
    unmount();
    
    // Should clean up the portal container
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it('only creates one portal container', () => {
    render(<Portal>Test content</Portal>);
    
    // Run timers to let the useEffect run
    jest.runAllTimers();
    
    // First call to render should create one container
    expect(document.body.appendChild).toHaveBeenCalledTimes(1);
    
    // Reset the mock
    document.body.appendChild.mockClear();
    
    // Render another portal
    render(<Portal>Another portal</Portal>);
    
    // Run timers again
    jest.runAllTimers();
    
    // Second call should create another container
    expect(document.body.appendChild).toHaveBeenCalledTimes(1);
  });
}); 