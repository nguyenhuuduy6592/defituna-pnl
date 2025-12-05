import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Portal } from '../../../components/common/Portal';

// Mock createPortal to make it testable
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node, container) => {
    // Instead of actually creating a portal, we'll just return the content
    // with a data attribute so we can find it in the tests
    return <div data-testid="mock-portal">{node}</div>;
  },
}));

describe('Portal Component', () => {
  it('renders children content when mounted', () => {
    render(<Portal>Test content</Portal>);

    // With our mock, the content should be rendered directly with our test ID
    expect(screen.getByTestId('mock-portal')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders different content when provided', () => {
    render(<Portal><button>Click me</button></Portal>);

    // Check that the new content is rendered
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('does not render anything when not mounted', () => {
    // We create a component that conditionally renders a Portal
    const TestComponent = ({ show }) => {
      return show ? <Portal>Test content</Portal> : null;
    };

    const { rerender } = render(<TestComponent show={false} />);

    // Portal should not be rendered
    expect(screen.queryByTestId('mock-portal')).not.toBeInTheDocument();

    // Now show the portal
    rerender(<TestComponent show={true} />);

    // Portal should now be rendered
    expect(screen.getByTestId('mock-portal')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});