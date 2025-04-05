import React from 'react';
import { render, screen, userEvent } from '../test-utils';
import TimeframeSelector from '../../../components/common/TimeframeSelector';

describe('TimeframeSelector Component', () => {
  const defaultTimeframes = ['24h', '7d', '30d'];
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with default timeframes', () => {
    render(<TimeframeSelector onChange={mockOnChange} />);

    defaultTimeframes.forEach(timeframe => {
      expect(screen.getByText(timeframe)).toBeInTheDocument();
    });
  });

  it('renders with custom timeframes', () => {
    const customTimeframes = ['1h', '12h', '48h'];
    render(
      <TimeframeSelector
        timeframes={customTimeframes}
        selected="12h"
        onChange={mockOnChange}
      />
    );

    customTimeframes.forEach(timeframe => {
      expect(screen.getByText(timeframe)).toBeInTheDocument();
    });
  });

  it('applies active class to selected timeframe', () => {
    render(
      <TimeframeSelector
        timeframes={defaultTimeframes}
        selected="7d"
        onChange={mockOnChange}
      />
    );

    const selectedButton = screen.getByText('7d');
    expect(selectedButton).toHaveClass('active');

    const nonSelectedButtons = defaultTimeframes
      .filter(t => t !== '7d')
      .map(t => screen.getByText(t));

    nonSelectedButtons.forEach(button => {
      expect(button).not.toHaveClass('active');
    });
  });

  it('calls onChange with correct timeframe when clicked', async () => {
    const user = userEvent.setup();
    render(
      <TimeframeSelector
        timeframes={defaultTimeframes}
        selected="24h"
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByText('7d'));
    expect(mockOnChange).toHaveBeenCalledWith('7d');

    await user.click(screen.getByText('30d'));
    expect(mockOnChange).toHaveBeenCalledWith('30d');
  });

  it('uses default selected timeframe when not provided', () => {
    render(<TimeframeSelector onChange={mockOnChange} />);

    const defaultSelectedButton = screen.getByText('24h');
    expect(defaultSelectedButton).toHaveClass('active');
  });

  it('handles empty timeframes array gracefully', () => {
    render(
      <TimeframeSelector
        timeframes={[]}
        selected="24h"
        onChange={mockOnChange}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('maintains button order matching timeframes array', () => {
    const customTimeframes = ['48h', '1h', '24h'];
    render(
      <TimeframeSelector
        timeframes={customTimeframes}
        selected="24h"
        onChange={mockOnChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    const buttonTexts = buttons.map(button => button.textContent);
    expect(buttonTexts).toEqual(customTimeframes);
  });

  it('handles repeated clicks on the same timeframe', async () => {
    const user = userEvent.setup();
    render(
      <TimeframeSelector
        timeframes={defaultTimeframes}
        selected="24h"
        onChange={mockOnChange}
      />
    );

    const button = screen.getByText('24h');
    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(mockOnChange).toHaveBeenCalledTimes(3);
    expect(mockOnChange).toHaveBeenCalledWith('24h');
  });

  it('renders buttons with correct accessibility attributes', () => {
    render(
      <TimeframeSelector
        timeframes={defaultTimeframes}
        selected="24h"
        onChange={mockOnChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(defaultTimeframes.length);

    buttons.forEach(button => {
      expect(button).toHaveAttribute('class');
      expect(button).toBeEnabled();
    });
  });
}); 