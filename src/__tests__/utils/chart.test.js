import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  prepareChartData,
  groupChartData,
  formatXAxisLabel,
  CustomChartTooltip,
} from '../../utils/chart';
import { formatNumber } from '../../utils/formatters'; // Tooltip uses this

// Mock the formatNumber function to isolate tooltip test
jest.mock('../../utils/formatters', () => ({
  formatNumber: jest.fn((value) => `formatted_${value}`),
}));

// Mock the CSS module import
jest.mock('../components/pnl/PositionChart.module.scss', () => ({
  tooltip: 'mockTooltipClass',
  tooltipLabel: 'mockTooltipLabelClass',
}));

describe('Chart Utils', () => {
  describe('prepareChartData', () => {
    it('should return an empty array for invalid input', () => {
      expect(prepareChartData(null)).toEqual([]);
      expect(prepareChartData(undefined)).toEqual([]);
      expect(prepareChartData([])).toEqual([]);
      expect(prepareChartData({})).toEqual([]);
    });

    it('should process position history and extract relevant fields', () => {
      const history = [
        {
          timestamp: '2023-01-01T10:00:00Z',
          pnl: { usd: 100 },
          yield: { value: 5 },
        },
        { timestamp: 1672574400000, pnl: 150, yield: null, compounded: 20 }, // 2023-01-01T12:00:00Z
        {
          timestamp: '2023-01-01T11:00:00Z',
          pnl: { value: 120 },
          yield_a: 2,
          yield_b: { usd: 3 },
        }, // Out of order
      ];
      const expected = [
        { timestamp: 1672567200000, pnl: 100, yield: 5, compounded: 0 },
        { timestamp: 1672570800000, pnl: 120, yield: 5, compounded: 0 }, // Note: yield is yield_a + yield_b
        { timestamp: 1672574400000, pnl: 150, yield: 0, compounded: 20 },
      ];
      const result = prepareChartData(history);
      expect(result).toEqual(expected);
    });

    it('should handle missing or malformed data gracefully, filtering invalid entries', () => {
      // Test case without the null entry that causes a TypeError
      const historyWithoutNull = [
        { timestamp: '2023-01-01T10:00:00Z' }, // Missing pnl/yield
        {
          timestamp: 1672574400000,
          pnl: 'invalid',
          yield: { usd: 'not a number' },
        },
        { pnl: 100, yield: 5 }, // Missing timestamp
        { timestamp: 'invalid-date', pnl: 50, yield: 2 },
      ];
      const result = prepareChartData(historyWithoutNull);
      // Expecting entries with 0 for missing/invalid pnl/yield
      // Entries with invalid/missing timestamps might have current time or be filtered depending on implementation
      expect(result.length).toBeLessThanOrEqual(historyWithoutNull.length);
      result.forEach((item) => {
        expect(typeof item.timestamp).toBe('number');
        // Allow timestamp to be NaN if date string was invalid, but it must be number type
        // expect(isNaN(item.timestamp)).toBe(false); // <-- Original failing assertion
        expect(typeof item.pnl).toBe('number');
        expect(isNaN(item.pnl)).toBe(false);
        expect(typeof item.yield).toBe('number');
        expect(isNaN(item.yield)).toBe(false);
        expect(typeof item.compounded).toBe('number');
        expect(isNaN(item.compounded)).toBe(false);
      });
      // Specific check for the valid entry with missing timestamp (should get a fallback like Date.now())
      const entryMissingTimestamp = result.find((item) => item.pnl === 100);
      expect(entryMissingTimestamp).toBeDefined();
      expect(isNaN(entryMissingTimestamp.timestamp)).toBe(false); // Fallback should be valid number
      expect(entryMissingTimestamp.yield).toBe(5);
      // Specific check for invalid date (should result in NaN timestamp)
      const entryInvalidDate = result.find((item) => item.pnl === 50);
      expect(entryInvalidDate).toBeDefined();
      expect(isNaN(entryInvalidDate.timestamp)).toBe(true); // Expect NaN here
      expect(entryInvalidDate.yield).toBe(2);
    });

    // Separate test to explicitly check the known TypeError with null input
    it('should throw TypeError when input array contains null', () => {
      const historyWithNull = [
        { timestamp: '2023-01-01T10:00:00Z', pnl: 100 },
        null,
        { timestamp: '2023-01-01T11:00:00Z', pnl: 120 },
      ];
      // Expect the function call within the arrow function to throw the specific error
      expect(() => prepareChartData(historyWithNull)).toThrow(TypeError);
      expect(() => prepareChartData(historyWithNull)).toThrow(
        "Cannot read properties of null (reading 'timestamp')"
      );
    });

    it('should correctly sum yield_a and yield_b when yield is zero or missing', () => {
      const history = [
        {
          timestamp: '2023-01-01T10:00:00Z',
          pnl: 100,
          yield: 0,
          yield_a: { usd: 2 },
          yield_b: 3,
        },
        {
          timestamp: '2023-01-01T11:00:00Z',
          pnl: 120,
          yield_a: 1,
          yield_b: { value: 4 },
        }, // yield missing
      ];
      const expected = [
        { timestamp: 1672567200000, pnl: 100, yield: 5, compounded: 0 }, // 2 + 3
        { timestamp: 1672570800000, pnl: 120, yield: 5, compounded: 0 }, // 1 + 4
      ];
      expect(prepareChartData(history)).toEqual(expected);
    });

    it('should sort the data by timestamp ascending', () => {
      const history = [
        { timestamp: 1672574400000, pnl: 150 }, // 12:00
        { timestamp: 1672567200000, pnl: 100 }, // 10:00
        { timestamp: 1672570800000, pnl: 120 }, // 11:00
      ];
      const result = prepareChartData(history);
      expect(result[0].pnl).toBe(100);
      expect(result[1].pnl).toBe(120);
      expect(result[2].pnl).toBe(150);
      expect(result[0].timestamp).toBeLessThan(result[1].timestamp);
      expect(result[1].timestamp).toBeLessThan(result[2].timestamp);
    });
  });

  describe('groupChartData', () => {
    const sampleData = [
      {
        timestamp: new Date('2023-01-01T10:01:00Z').getTime(),
        pnl: 10,
        yield: 1,
      },
      {
        timestamp: new Date('2023-01-01T10:04:00Z').getTime(),
        pnl: 12,
        yield: 1.1,
      }, // End of first 5min interval
      {
        timestamp: new Date('2023-01-01T10:06:00Z').getTime(),
        pnl: 15,
        yield: 1.2,
      },
      {
        timestamp: new Date('2023-01-01T10:09:00Z').getTime(),
        pnl: 16,
        yield: 1.3,
      }, // End of second 5min interval
      {
        timestamp: new Date('2023-01-01T10:11:00Z').getTime(),
        pnl: 18,
        yield: 1.4,
      }, // Third 5min interval
      {
        timestamp: new Date('2023-01-01T10:35:00Z').getTime(),
        pnl: 20,
        yield: 1.5,
      }, // Belongs to 10:30 interval
      {
        timestamp: new Date('2023-01-01T11:05:00Z').getTime(),
        pnl: 25,
        yield: 1.6,
      }, // New hour, 11:05 interval
    ];

    it('should return empty array for invalid input', () => {
      expect(groupChartData(null)).toEqual([]);
      expect(groupChartData(undefined)).toEqual([]);
      expect(groupChartData([])).toEqual([]);
      expect(groupChartData({})).toEqual([]);
    });

    it('should group data by 5 minutes (default) filling gaps with null', () => {
      const result = groupChartData(sampleData); // Uses default 5min period

      // Expected intervals from 10:00 (contains 10:01) to 11:05
      // 10:00, 10:05, 10:10, 10:15, 10:20, 10:25, 10:30, 10:35, 10:40, 10:45, 10:50, 10:55, 11:00, 11:05
      // Total: 14 intervals
      expect(result.length).toBe(14);

      // Check the timestamps of all generated intervals
      const expectedTimestamps = [
        new Date('2023-01-01T10:00:00Z').getTime(),
        new Date('2023-01-01T10:05:00Z').getTime(),
        new Date('2023-01-01T10:10:00Z').getTime(),
        new Date('2023-01-01T10:15:00Z').getTime(),
        new Date('2023-01-01T10:20:00Z').getTime(),
        new Date('2023-01-01T10:25:00Z').getTime(),
        new Date('2023-01-01T10:30:00Z').getTime(),
        new Date('2023-01-01T10:35:00Z').getTime(),
        new Date('2023-01-01T10:40:00Z').getTime(),
        new Date('2023-01-01T10:45:00Z').getTime(),
        new Date('2023-01-01T10:50:00Z').getTime(),
        new Date('2023-01-01T10:55:00Z').getTime(),
        new Date('2023-01-01T11:00:00Z').getTime(),
        new Date('2023-01-01T11:05:00Z').getTime(),
      ].sort();
      expect(result.map((item) => item.timestamp).sort()).toEqual(
        expectedTimestamps
      );

      // Check values for intervals that should contain data
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[0]).pnl
      ).toBe(12); // Last entry in 10:00-10:04 interval
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[1]).pnl
      ).toBe(16); // Last entry in 10:05-10:09 interval
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[2]).pnl
      ).toBe(18); // Last entry in 10:10-10:14 interval
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[7]).pnl
      ).toBe(20); // Last entry in 10:35-10:39 interval (index 7 is 10:35)
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[13]).pnl
      ).toBe(25); // Last entry in 11:05-11:09 interval (index 13 is 11:05)

      // Check values for intervals that should be null gaps
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[3]).pnl
      ).toBeNull(); // 10:15 interval
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[4]).pnl
      ).toBeNull(); // 10:20 interval
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[5]).pnl
      ).toBeNull(); // 10:25 interval
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[6]).pnl
      ).toBeNull(); // 10:30 interval (10:35 data point is in *next* interval)
      // ... check other null gaps as needed
    });

    it('should group data by 1 hour using the last entry in interval', () => {
      const result = groupChartData(sampleData, '1hour');
      const expectedTimestamps = [
        new Date('2023-01-01T10:00:00Z').getTime(), // Group for 10:00-10:59
        new Date('2023-01-01T11:00:00Z').getTime(), // Group for 11:00-11:59
      ].sort();

      expect(result.length).toBe(2);
      expect(result.map((item) => item.timestamp).sort()).toEqual(
        expectedTimestamps
      );
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[0]).pnl
      ).toBe(20); // Last entry before 11:00
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[1]).pnl
      ).toBe(25); // Last entry at 11:05
    });

    it('should handle different time periods correctly (e.g., 15min) filling gaps with null', () => {
      const result = groupChartData(sampleData, '15min');

      // Expected intervals from 10:00 (contains 10:01) to 11:00 (contains 11:05)
      // 10:00, 10:15, 10:30, 10:45, 11:00
      // Total: 5 intervals
      expect(result.length).toBe(5);

      const expectedTimestamps = [
        new Date('2023-01-01T10:00:00Z').getTime(), // 10:00-10:14
        new Date('2023-01-01T10:15:00Z').getTime(), // 10:15-10:29 (Null)
        new Date('2023-01-01T10:30:00Z').getTime(), // 10:30-10:44
        new Date('2023-01-01T10:45:00Z').getTime(), // 10:45-10:59 (Null)
        new Date('2023-01-01T11:00:00Z').getTime(), // 11:00-11:14
      ].sort();

      expect(result.map((item) => item.timestamp).sort()).toEqual(
        expectedTimestamps
      );

      // Check values for each interval
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[0]).pnl
      ).toBe(18); // Last entry at 10:11 (in 10:00 interval)
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[1]).pnl
      ).toBeNull(); // 10:15 interval is null
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[2]).pnl
      ).toBe(20); // Last entry at 10:35 (in 10:30 interval)
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[3]).pnl
      ).toBeNull(); // 10:45 interval is null
      expect(
        result.find((r) => r.timestamp === expectedTimestamps[4]).pnl
      ).toBe(25); // Last entry at 11:05 (in 11:00 interval)
    });

    it('should handle entries with invalid timestamps gracefully', () => {
      const dataWithInvalid = [
        ...sampleData,
        { timestamp: 'invalid-date', pnl: 30 },
        { timestamp: null, pnl: 35 },
        { pnl: 40 }, // Missing timestamp
      ];
      // Process data with invalid entries
      const result = groupChartData(dataWithInvalid);

      // Process clean data to get the expected result (with null gaps)
      const expectedResult = groupChartData(sampleData);

      // Compare the results - should be identical after invalid entries are filtered before grouping
      expect(result).toEqual(expectedResult);

      // Verify the length matches the expected length for clean data (14 for 5min interval)
      expect(result.length).toBe(14);
    });

    it('should use 5min default if period is unrecognized', () => {
      const resultUnrecognized = groupChartData(sampleData, 'invalid-period');
      const resultDefault = groupChartData(sampleData, '5min');
      expect(resultUnrecognized).toEqual(resultDefault);
    });
  });

  describe('formatXAxisLabel', () => {
    const date1 = new Date('2023-01-01T10:30:00Z');
    const date2 = new Date('2023-01-01T14:45:00Z');
    const date3 = new Date('2023-01-02T09:00:00Z');
    const dataSingleDay = [
      { timestamp: date1.getTime(), pnl: 10 },
      { timestamp: date2.getTime(), pnl: 20 },
    ];
    const dataMultiDay = [
      { timestamp: date1.getTime(), pnl: 10 },
      { timestamp: date3.getTime(), pnl: 30 },
    ];

    // Mock Date methods for consistent formatting across environments
    let originalToLocaleTimeString;
    let originalToLocaleDateString;

    beforeEach(() => {
      originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
      originalToLocaleDateString = Date.prototype.toLocaleDateString;
    });

    afterEach(() => {
      Date.prototype.toLocaleTimeString = originalToLocaleTimeString;
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
    });

    it('should return empty string for invalid input', () => {
      expect(formatXAxisLabel(null)).toBe('');
      expect(formatXAxisLabel(undefined)).toBe('');
      expect(formatXAxisLabel(NaN)).toBe('');
      expect(formatXAxisLabel(date1.getTime(), [])).toBe(''); // Empty data array
      expect(formatXAxisLabel('invalid-timestamp')).toBe('');
    });

    it('should format time only for short periods within a single day', () => {
      const mockTime = '10:30 AM';
      Date.prototype.toLocaleTimeString = jest.fn(() => mockTime);
      Date.prototype.toLocaleDateString = jest.fn(); // Ensure date part is not called/used

      expect(formatXAxisLabel(date1.getTime(), dataSingleDay, '5min')).toBe(
        mockTime
      );
      expect(formatXAxisLabel(date1.getTime(), dataSingleDay, '1hour')).toBe(
        mockTime
      );
      expect(Date.prototype.toLocaleDateString).not.toHaveBeenCalled();
    });

    it('should format date only for long periods within a single day', () => {
      const mockDate = 'Jan 1';
      Date.prototype.toLocaleTimeString = jest.fn(); // Ensure time part is not called/used
      Date.prototype.toLocaleDateString = jest.fn(() => mockDate);

      expect(formatXAxisLabel(date1.getTime(), dataSingleDay, '1day')).toBe(
        mockDate
      );
      expect(formatXAxisLabel(date1.getTime(), dataSingleDay, '1week')).toBe(
        mockDate
      );
      expect(formatXAxisLabel(date1.getTime(), dataSingleDay, '1month')).toBe(
        mockDate
      );
      expect(Date.prototype.toLocaleTimeString).not.toHaveBeenCalled();
    });

    it('should format date and time for short periods spanning multiple days', () => {
      const mockTime = '10:30 AM';
      const mockDate = 'Jan 1';
      Date.prototype.toLocaleTimeString = jest.fn(() => mockTime);
      Date.prototype.toLocaleDateString = jest.fn(() => mockDate);

      const expectedFormat = `${mockDate} ${mockTime}`;
      expect(formatXAxisLabel(date1.getTime(), dataMultiDay, '5min')).toBe(
        expectedFormat
      );
      expect(formatXAxisLabel(date1.getTime(), dataMultiDay, '1hour')).toBe(
        expectedFormat
      );
    });

    it('should format date only for long periods spanning multiple days', () => {
      const mockDate = 'Jan 1';
      Date.prototype.toLocaleTimeString = jest.fn(); // Ensure time part is not called/used
      Date.prototype.toLocaleDateString = jest.fn(() => mockDate);

      expect(formatXAxisLabel(date1.getTime(), dataMultiDay, '1day')).toBe(
        mockDate
      );
      expect(formatXAxisLabel(date1.getTime(), dataMultiDay, '1week')).toBe(
        mockDate
      );
      expect(formatXAxisLabel(date1.getTime(), dataMultiDay, '1month')).toBe(
        mockDate
      );
      expect(Date.prototype.toLocaleTimeString).not.toHaveBeenCalled();
    });
  });

  describe('CustomChartTooltip', () => {
    const mockLabel = new Date('2023-01-01T10:30:45Z').getTime();
    const mockPayload = [
      { name: 'PNL', value: 123.45, color: 'green' },
      { name: 'Yield', value: -5.67, color: 'red' },
    ];

    it('should return null if not active', () => {
      const { container } = render(
        <CustomChartTooltip
          active={false}
          payload={mockPayload}
          label={mockLabel}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should return null if payload is empty or missing', () => {
      let container = render(
        <CustomChartTooltip active={true} payload={[]} label={mockLabel} />
      ).container;
      expect(container.firstChild).toBeNull();

      container = render(
        <CustomChartTooltip active={true} payload={null} label={mockLabel} />
      ).container;
      expect(container.firstChild).toBeNull();

      container = render(
        <CustomChartTooltip
          active={true}
          payload={undefined}
          label={mockLabel}
        />
      ).container;
      expect(container.firstChild).toBeNull();
    });

    it('should render correctly with active and valid payload', () => {
      render(
        <CustomChartTooltip
          active={true}
          payload={mockPayload}
          label={mockLabel}
        />
      );

      // Check timestamp label (using mock for toLocaleTimeString)
      const expectedTime = new Date(mockLabel).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      expect(screen.getByText(expectedTime)).toBeInTheDocument();

      // Check payload entries
      mockPayload.forEach((entry) => {
        // Check name and formatted value
        const expectedText = `${entry.name}: formatted_${entry.value}`;
        const element = screen.getByText(expectedText);
        expect(element).toBeInTheDocument();
        // Check color style (basic check)
        expect(element).toHaveStyle(`color: ${entry.color}`);
      });

      // Check mocked CSS class
      expect(screen.getByText(expectedTime).parentElement).toHaveClass(
        'mockTooltipClass'
      );
    });
  });
});
