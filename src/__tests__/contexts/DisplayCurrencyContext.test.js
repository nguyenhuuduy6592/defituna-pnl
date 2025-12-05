import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DisplayCurrencyProvider, useDisplayCurrency } from '../../contexts/DisplayCurrencyContext';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

function TestComponent() {
  const { showInSol, toggleCurrency, currentCurrency } = useDisplayCurrency();
  return (
    <div>
      <span data-testid="currency">{currentCurrency}</span>
      <button onClick={toggleCurrency}>Toggle</button>
      <span data-testid="showInSol">{showInSol ? 'true' : 'false'}</span>
    </div>
  );
}

describe('DisplayCurrencyContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to USD', () => {
    render(
      <DisplayCurrencyProvider>
        <TestComponent />
      </DisplayCurrencyProvider>
    );
    expect(screen.getByTestId('currency')).toHaveTextContent('USD');
    expect(screen.getByTestId('showInSol')).toHaveTextContent('false');
  });

  it('toggles between USD and TOKENS', () => {
    render(
      <DisplayCurrencyProvider>
        <TestComponent />
      </DisplayCurrencyProvider>
    );
    const button = screen.getByText('Toggle');
    act(() => { button.click(); });
    expect(screen.getByTestId('currency')).toHaveTextContent('TOKENS');
    expect(screen.getByTestId('showInSol')).toHaveTextContent('true');
    act(() => { button.click(); });
    expect(screen.getByTestId('currency')).toHaveTextContent('USD');
    expect(screen.getByTestId('showInSol')).toHaveTextContent('false');
  });

  it('persists value to localStorage', () => {
    render(
      <DisplayCurrencyProvider>
        <TestComponent />
      </DisplayCurrencyProvider>
    );
    const button = screen.getByText('Toggle');
    act(() => { button.click(); });
    expect(window.localStorage.getItem('defituna-pnl-showInSol')).toBe('true');
    act(() => { button.click(); });
    expect(window.localStorage.getItem('defituna-pnl-showInSol')).toBe('false');
  });

  it('throws error if used outside provider', () => {
    // Suppress error output for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function BrokenComponent() {
      useDisplayCurrency();
      return null;
    }
    expect(() => render(<BrokenComponent />)).toThrow();
    spy.mockRestore();
  });
});