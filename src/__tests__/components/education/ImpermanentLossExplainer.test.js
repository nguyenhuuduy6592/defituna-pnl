import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImpermanentLossExplainer from '@/components/education/ImpermanentLossExplainer';

// Mock the InfoIcon component with a span to avoid DOM nesting errors
jest.mock('@/components/common/InfoIcon', () => {
  return function MockInfoIcon({ content, position, size }) {
    return (
      <span data-testid="info-icon" data-content={content} data-position={position} data-size={size}>
        Info Icon
      </span>
    );
  };
});

// Suppress console.error for DOM nesting warnings
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0].includes('Warning: validateDOMNesting')) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ImpermanentLossExplainer Component', () => {
  beforeEach(() => {
    render(<ImpermanentLossExplainer />);
  });

  it('renders the component title', () => {
    expect(screen.getByText('Understanding Impermanent Loss')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    expect(screen.getByText('An important concept for liquidity providers')).toBeInTheDocument();
  });

  it('renders the definition section', () => {
    expect(screen.getByText('What is Impermanent Loss?')).toBeInTheDocument();
    expect(screen.getByText(/Impermanent loss occurs when the price of your tokens changes/)).toBeInTheDocument();
  });

  it('includes the InfoIcon component', () => {
    const infoIcon = screen.getByTestId('info-icon');
    expect(infoIcon).toBeInTheDocument();
  });

  it('renders the example scenario', () => {
    expect(screen.getByText('Example Scenario')).toBeInTheDocument();
    expect(screen.getByText('Initial deposit:')).toBeInTheDocument();
    expect(screen.getByText('Price change:')).toBeInTheDocument();
    expect(screen.getByText('Result:')).toBeInTheDocument();
  });

  it('shows the HODLing comparison', () => {
    expect(screen.getByText('If you HODL')).toBeInTheDocument();
  });

  it('shows the liquidity pool outcome', () => {
    expect(screen.getByText('From Liquidity Pool')).toBeInTheDocument();
  });

  it('renders the impermanent loss calculation', () => {
    expect(screen.getByText(/Impermanent Loss: \$5.06 \(2.02%\)/)).toBeInTheDocument();
  });

  it('renders mitigation strategies section', () => {
    expect(screen.getByText('Mitigating Impermanent Loss')).toBeInTheDocument();
    expect(screen.getByText(/Provide liquidity to stable pairs/)).toBeInTheDocument();
    expect(screen.getByText(/Consider the fee income/)).toBeInTheDocument();
    expect(screen.getByText(/Check the volatility rating/)).toBeInTheDocument();
  });
}); 