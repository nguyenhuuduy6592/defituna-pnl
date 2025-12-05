import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeframeSelector from '../../../components/common/TimeframeSelector';

// Mock the TimeframeSelector styles
jest.mock('../../../styles/TimeframeSelector.module.scss', () => ({
  timeframeSelector: 'timeframeSelector',
  timeframeButton: 'timeframeButton',
  active: 'active',
}));

describe('TimeframeSelector Component', () => {
  const defaultTimeframes = ['24h', '7d', '30d'];
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all timeframe options', () => {
    render(
      <TimeframeSelector
        timeframes={defaultTimeframes}
        selected="24h"
        onChange={mockOnChange}
      />
    );

    defaultTimeframes.forEach(timeframe => {
      expect(screen.getByText(timeframe)).toBeInTheDocument();
    });
  });

  it('highlights the selected timeframe with active class', () => {
    render(
      <TimeframeSelector
        timeframes={defaultTimeframes}
        selected="7d"
        onChange={mockOnChange}
      />
    );

    const selectedButton = screen.getByText('7d');
    expect(selectedButton).toHaveClass('active');

    // Check that other buttons don't have the active class
    const notSelectedButton1 = screen.getByText('24h');
    const notSelectedButton2 = screen.getByText('30d');
    expect(notSelectedButton1).not.toHaveClass('active');
    expect(notSelectedButton2).not.toHaveClass('active');
  });

  it('calls onChange with correct timeframe when a button is clicked', () => {
    render(
      <TimeframeSelector
        timeframes={defaultTimeframes}
        selected="24h"
        onChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('7d'));
    expect(mockOnChange).toHaveBeenCalledWith('7d');

    fireEvent.click(screen.getByText('30d'));
    expect(mockOnChange).toHaveBeenCalledWith('30d');
  });

  it('uses default timeframes when none are provided', () => {
    render(
      <TimeframeSelector
        selected="24h"
        onChange={mockOnChange}
      />
    );

    defaultTimeframes.forEach(timeframe => {
      expect(screen.getByText(timeframe)).toBeInTheDocument();
    });
  });

  it('uses default selected timeframe when none is provided', () => {
    render(
      <TimeframeSelector
        timeframes={defaultTimeframes}
        onChange={mockOnChange}
      />
    );

    const selectedButton = screen.getByText('24h');
    expect(selectedButton).toHaveClass('active');
  });

  it('renders custom timeframes correctly', () => {
    const customTimeframes = ['1h', '6h', '12h', '1d'];

    render(
      <TimeframeSelector
        timeframes={customTimeframes}
        selected="6h"
        onChange={mockOnChange}
      />
    );

    customTimeframes.forEach(timeframe => {
      expect(screen.getByText(timeframe)).toBeInTheDocument();
    });

    const selectedButton = screen.getByText('6h');
    expect(selectedButton).toHaveClass('active');
  });

  it('applies timeframeSelector class to container div', () => {
    render(
      <TimeframeSelector
        timeframes={defaultTimeframes}
        selected="24h"
        onChange={mockOnChange}
      />
    );

    const container = screen.getByText('24h').closest('.timeframeSelector');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('timeframeSelector');
  });

  it('applies timeframeButton class to all buttons', () => {
    render(
      <TimeframeSelector
        timeframes={defaultTimeframes}
        selected="24h"
        onChange={mockOnChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(defaultTimeframes.length);

    buttons.forEach(button => {
      expect(button).toHaveClass('timeframeButton');
    });
  });
});