import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import {
  exportChartAsImage,
  exportCardAsImage,
  shareCard,
} from '../../utils/export';

// --- Mocks ---
jest.mock('html-to-image', () => ({
  toPng: jest.fn(),
}));

jest.mock('html2canvas', () => jest.fn());

// Mock document.createElement to simulate link clicking for download
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
};
global.document.createElement = jest.fn(() => mockLink);

// Mock URL object methods for share fallback
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock navigator.share API
const mockNavigatorShare = jest.fn();
global.navigator.share = mockNavigatorShare;

// Mock File constructor
global.File = jest.fn((blob, fileName, options) => ({
  blob,
  name: fileName,
  type: options?.type,
}));

// Mock fetch for blob conversion
global.fetch = jest.fn(() =>
  Promise.resolve({
    blob: () =>
      Promise.resolve(new Blob(['mock blob content'], { type: 'image/png' })),
  })
);

// Mock console
let consoleErrorSpy;
let consoleWarnSpy;

// --- Test Suite ---
describe('Export Utilities', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Reset link mock state
    mockLink.href = '';
    mockLink.download = '';

    // Setup default successful mock implementations
    toPng.mockResolvedValue('mock-data-url-from-toPng');
    html2canvas.mockResolvedValue({
      toDataURL: jest.fn(() => 'mock-data-url-from-canvas'),
      toBlob: jest.fn((callback) => {
        const blob = new Blob(['mock blob content'], { type: 'image/png' });
        callback(blob);
      }),
    });
    mockNavigatorShare.mockResolvedValue(undefined); // Simulate successful share

    // Spy on console
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console spies
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  // --- Test Cases ---
  describe('exportChartAsImage (using html2canvas)', () => {
    const mockElement = { current: document.createElement('div') };
    const defaultFileName = `export-${new Date().toISOString().slice(0, 10)}.png`;

    it('should export element successfully with given filename', async () => {
      const fileName = 'chart.png';
      const result = await exportChartAsImage(mockElement, fileName);

      expect(result).toBe(true);
      expect(html2canvas).toHaveBeenCalledWith(
        mockElement.current,
        expect.objectContaining({ scale: 2 })
      );
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(fileName);
      expect(mockLink.href).toBe('mock-data-url-from-canvas');
      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });

    it('should use default filename if none provided', async () => {
      const result = await exportChartAsImage(mockElement);

      expect(result).toBe(true);
      expect(mockLink.download).toMatch(/^export-\d{4}-\d{2}-\d{2}\.png$/);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[exportCardAsImage] No file name provided, using default:',
        expect.stringMatching(/^export-\d{4}-\d{2}-\d{2}\.png$/)
      );
    });

    it('should return false and log error if elementRef is invalid', async () => {
      const result1 = await exportChartAsImage(null, 'test.png');
      const result2 = await exportChartAsImage({ current: null }, 'test.png');

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(html2canvas).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid element reference')
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });

    it('should return false and log error if html2canvas fails', async () => {
      const error = new Error('Canvas generation failed');
      html2canvas.mockRejectedValueOnce(error);

      const result = await exportChartAsImage(mockElement, 'test.png');

      expect(result).toBe(false);
      expect(html2canvas).toHaveBeenCalled();
      expect(mockLink.click).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error exporting card'),
        error
      );
    });
  });

  describe('exportCardAsImage (using html-to-image)', () => {
    const mockElement = { current: document.createElement('div') };
    const defaultFileName = `export-${new Date().toISOString().slice(0, 10)}.png`;

    it('should export element successfully with given filename', async () => {
      const fileName = 'card.png';
      const result = await exportCardAsImage(mockElement, fileName);

      expect(result).toBe(true);
      expect(toPng).toHaveBeenCalledWith(
        mockElement.current,
        expect.objectContaining({
          quality: 1.0,
          pixelRatio: 2,
          skipAutoScale: true,
        })
      );
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(fileName);
      expect(mockLink.href).toBe('mock-data-url-from-toPng');
      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });

    it('should use default filename if none provided', async () => {
      const result = await exportCardAsImage(mockElement);

      expect(result).toBe(true);
      expect(mockLink.download).toMatch(/^export-\d{4}-\d{2}-\d{2}\.png$/);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[exportCardAsImage] No file name provided, using default:',
        expect.stringMatching(/^export-\d{4}-\d{2}-\d{2}\.png$/)
      );
    });

    it('should return false and log error if contentRef is invalid', async () => {
      const result1 = await exportCardAsImage(null, 'test.png');
      const result2 = await exportCardAsImage({ current: null }, 'test.png');

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(toPng).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid content element reference')
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });

    it('should return false and log error if toPng fails', async () => {
      const error = new Error('toPng generation failed');
      toPng.mockRejectedValueOnce(error);

      const result = await exportCardAsImage(mockElement, 'test.png');

      expect(result).toBe(false);
      expect(toPng).toHaveBeenCalled();
      expect(mockLink.click).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error exporting card'),
        error
      );
    });
  });

  describe('shareCard (using html-to-image)', () => {
    const mockContentElement = document.createElement('div');
    const mockElement = {
      current: document.createElement('div'),
    };
    mockElement.current.querySelector = jest
      .fn()
      .mockReturnValue(mockContentElement);

    const defaultFileName = `share-${new Date().toISOString().slice(0, 10)}.png`;
    const shareTitle = 'Test Share Title';
    const shareText = 'Test Share Text';

    it('should share successfully using navigator.share', async () => {
      const fileName = 'share.png';
      const result = await shareCard(
        mockElement,
        fileName,
        shareTitle,
        shareText
      );

      expect(result).toBe(true);
      expect(toPng).toHaveBeenCalledWith(
        mockContentElement,
        expect.objectContaining({
          quality: 1.0,
          pixelRatio: 2,
          skipAutoScale: true,
        })
      );
      expect(File).toHaveBeenCalledTimes(1);
      expect(navigator.share).toHaveBeenCalledTimes(1);
      expect(navigator.share).toHaveBeenCalledWith({
        files: [expect.any(Object)],
        title: shareTitle,
        text: shareText,
      });
      expect(mockLink.click).not.toHaveBeenCalled(); // Fallback not used
    });

    it('should fallback to download if navigator.share is not supported', async () => {
      const fileName = 'share-fallback.png';
      global.navigator.share = undefined; // Simulate unsupported API

      const result = await shareCard(
        mockElement,
        fileName,
        shareTitle,
        shareText
      );

      expect(result).toBe(true);
      expect(toPng).toHaveBeenCalled();
      expect(File).toHaveBeenCalledTimes(1);
      expect(mockNavigatorShare).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Web Share API not supported')
      );

      // Check download fallback
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(fileName);
      expect(mockLink.href).toBe('mock-blob-url');
      expect(mockLink.click).toHaveBeenCalledTimes(1);
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

      // Restore share API for other tests
      global.navigator.share = mockNavigatorShare;
    });

    it('should return false if content element is not found', async () => {
      mockElement.current.querySelector.mockReturnValueOnce(null);
      const result = await shareCard(mockElement, 'test.png');

      expect(result).toBe(false);
      expect(toPng).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not find content element')
      );
    });

    it('should return false and log error if elementRef is invalid', async () => {
      const result1 = await shareCard(null, 'test.png');
      const result2 = await shareCard({ current: null }, 'test.png');

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(toPng).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid element reference')
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });

    it('should return false and log error if toPng fails', async () => {
      const error = new Error('Image generation failed');
      toPng.mockRejectedValueOnce(error);

      const result = await shareCard(mockElement, 'test.png');

      expect(result).toBe(false);
      expect(toPng).toHaveBeenCalled();
      expect(navigator.share).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error sharing card'),
        error
      );
    });

    it('should return false and log error if blob creation fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Blob creation failed'));

      const result = await shareCard(mockElement, 'test.png');

      expect(result).toBe(false);
      expect(toPng).toHaveBeenCalled();
      expect(navigator.share).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error sharing card'),
        expect.any(Error)
      );
    });

    it('should return false and log error if navigator.share rejects', async () => {
      const shareError = new Error('Share cancelled by user');
      mockNavigatorShare.mockRejectedValueOnce(shareError);

      const result = await shareCard(mockElement, 'test.png');

      expect(result).toBe(false);
      expect(toPng).toHaveBeenCalled();
      expect(navigator.share).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error sharing card'),
        shareError
      );
    });
  });
});
