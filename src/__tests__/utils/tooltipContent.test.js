import {
  getFeeAPRTooltip,
  getVolumeTVLTooltip,
  getVolatilityTooltip,
  getTVLTooltip,
  getVolumeTooltip,
  getYieldTooltip,
  getFeeRateTooltip,
  getImpermanentLossTooltip,
  getPriceImpactTooltip,
} from '@/utils/tooltipContent';

describe('Tooltip Content Utilities', () => {
  describe('getFeeAPRTooltip', () => {
    it('should return correct tooltip for high APR', () => {
      expect(getFeeAPRTooltip('55.5')).toMatchSnapshot();
    });

    it('should return correct tooltip for medium-high APR', () => {
      expect(getFeeAPRTooltip('25')).toMatchSnapshot();
    });

    it('should return correct tooltip for medium APR', () => {
      expect(getFeeAPRTooltip('15')).toMatchSnapshot();
    });

    it('should return correct tooltip for low APR', () => {
      expect(getFeeAPRTooltip('5')).toMatchSnapshot();
    });

    it('should handle zero APR', () => {
      expect(getFeeAPRTooltip('0')).toMatchSnapshot();
    });

    it('should handle non-numeric input gracefully (defaults to low)', () => {
      // parseFloat('abc') results in NaN, which fails all checks >= 10
      expect(getFeeAPRTooltip('abc')).toMatchSnapshot();
    });
  });

  describe('getVolumeTVLTooltip', () => {
    it('should return correct tooltip for excellent efficiency', () => {
      expect(getVolumeTVLTooltip('6')).toMatchSnapshot();
    });

    it('should return correct tooltip for good efficiency', () => {
      expect(getVolumeTVLTooltip('3')).toMatchSnapshot();
    });

    it('should return correct tooltip for average efficiency', () => {
      expect(getVolumeTVLTooltip('1.5')).toMatchSnapshot();
    });

    it('should return correct tooltip for below average efficiency', () => {
      expect(getVolumeTVLTooltip('0.7')).toMatchSnapshot();
    });

    it('should return correct tooltip for poor efficiency', () => {
      expect(getVolumeTVLTooltip('0.2')).toMatchSnapshot();
    });

     it('should handle zero ratio', () => {
      expect(getVolumeTVLTooltip('0')).toMatchSnapshot();
    });

    it('should handle non-numeric input gracefully (defaults to poor)', () => {
       // parseFloat('abc') results in NaN, which fails all checks >= 0.5
      expect(getVolumeTVLTooltip('abc')).toMatchSnapshot();
    });
  });

  describe('getVolatilityTooltip', () => {
    it('should return correct tooltip for high volatility', () => {
      expect(getVolatilityTooltip('High')).toMatchSnapshot();
    });

     it('should return correct tooltip for medium volatility (case insensitive)', () => {
      expect(getVolatilityTooltip('medium')).toMatchSnapshot();
    });

     it('should return correct tooltip for low volatility', () => {
      expect(getVolatilityTooltip('Low')).toMatchSnapshot();
    });

     it('should return default tooltip for unknown volatility', () => {
      expect(getVolatilityTooltip('unknown')).toMatchSnapshot();
    });

     it('should return default tooltip for empty input', () => {
      expect(getVolatilityTooltip('')).toMatchSnapshot();
    });
  });

  describe('getTVLTooltip', () => {
    it('should return the correct static tooltip content', () => {
      expect(getTVLTooltip()).toMatchSnapshot(); // Note: parameter 'value' is unused in implementation
    });
  });

  describe('getVolumeTooltip', () => {
    it('should return the correct tooltip content with timeframe', () => {
      expect(getVolumeTooltip('24h')).toMatchSnapshot();
    });
  });

  describe('getYieldTooltip', () => {
     it('should return the correct tooltip content with timeframe', () => {
      expect(getYieldTooltip('7d')).toMatchSnapshot();
    });
  });

  describe('getFeeRateTooltip', () => {
    it('should return the correct static tooltip content', () => {
      expect(getFeeRateTooltip()).toMatchSnapshot();
    });
  });

  describe('getImpermanentLossTooltip', () => {
    it('should return the correct static tooltip content', () => {
      expect(getImpermanentLossTooltip()).toMatchSnapshot();
    });
  });

  describe('getPriceImpactTooltip', () => {
    it('should return the correct static tooltip content', () => {
      expect(getPriceImpactTooltip()).toMatchSnapshot();
    });
  });
}); 