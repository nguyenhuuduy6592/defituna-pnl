import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CurrencyToggle } from '../../../components/common/CurrencyToggle';
import { DisplayCurrencyProvider } from '../../../contexts/DisplayCurrencyContext';

const renderWithProvider = (ui) =>
  render(<DisplayCurrencyProvider>{ui}</DisplayCurrencyProvider>);

describe('CurrencyToggle', () => {
  it('renders with current currency', () => {
    renderWithProvider(<CurrencyToggle />);
    expect(
      screen.getByRole('button', { name: /Display:/i })
    ).toBeInTheDocument();
  });

  it('toggles currency on click', () => {
    renderWithProvider(<CurrencyToggle />);
    const button = screen.getByRole('button');
    const initialText = button.textContent;
    fireEvent.click(button);
    expect(button.textContent).not.toBe(initialText);
  });

  it('has correct aria-live and title attributes', () => {
    renderWithProvider(<CurrencyToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-live', 'polite');
    expect(button).toHaveAttribute('title');
    expect(button).toHaveAttribute('data-tooltip');
  });
});
