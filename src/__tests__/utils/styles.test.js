import { getValueClass } from '../../utils/styles';

describe('Styles Utility', () => {
  describe('getValueClass', () => {
    it('returns "positive" for values greater than zero', () => {
      expect(getValueClass(10)).toBe('positive');
      expect(getValueClass(0.1)).toBe('positive');
      expect(getValueClass(Number.MAX_SAFE_INTEGER)).toBe('positive');
    });

    it('returns "negative" for values less than zero', () => {
      expect(getValueClass(-10)).toBe('negative');
      expect(getValueClass(-0.1)).toBe('negative');
      expect(getValueClass(-Number.MAX_SAFE_INTEGER)).toBe('negative');
    });

    it('returns "zero" for values equal to zero', () => {
      expect(getValueClass(0)).toBe('zero');
      expect(getValueClass(-0)).toBe('zero'); // JavaScript treats -0 as equal to 0
    });

    it('handles edge cases correctly', () => {
      expect(getValueClass(NaN)).toBe('zero'); // NaN is not greater or less than 0
    });
  });
}); 