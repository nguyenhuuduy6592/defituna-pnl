// Mock the functions from the module itself if needed for spying
// jest.mock('../notifications', () => {
//   const originalModule = jest.requireActual('../notifications');
//   return {
//     ...originalModule,
//     showNotification: jest.fn(), // Mock showNotification if we only want to check if it's called
//   };
// });

// --- Mocks for Browser APIs ---

// Mock DOM manipulation
const mockNotificationElement = {
  style: { cssText: '', opacity: '' },
  offsetHeight: 10, // Mock offsetHeight to trigger reflow
  setAttribute: jest.fn(),
  textContent: '',
  remove: jest.fn(),
};
document.createElement = jest.fn(() => mockNotificationElement);
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();
document.body.contains = jest.fn(() => true); // Assume element is always in body for removal check

// Mock Clipboard API
const mockWriteText = jest.fn();
global.navigator.clipboard = { writeText: mockWriteText };
Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });

// Mock document.execCommand
document.execCommand = jest.fn(() => true); // Default to successful execCommand

// Mock console
let consoleErrorSpy;
let consoleWarnSpy;

// --- Test Suite ---
describe('Notification Utilities', () => {

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Use fake timers
    jest.useFakeTimers();

    // Reset notification element mock state
    Object.assign(mockNotificationElement.style, { cssText: '', opacity: '' });
    mockNotificationElement.setAttribute.mockClear();
    mockNotificationElement.remove.mockClear();
    mockNotificationElement.textContent = '';
    
    // Default mock implementations
    mockWriteText.mockResolvedValue(undefined); // Successful clipboard write
    document.execCommand.mockReturnValue(true);
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true }); // Reset secure context

    // Spy on console
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console spies
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    // Restore real timers
    jest.useRealTimers();
    // Restore secure context if modified
     Object.defineProperty(window, 'isSecureContext', { value: window.isSecureContext, configurable: true });
  });

  // --- showNotification Tests ---
  describe('showNotification', () => {
    const message = 'Test notification';
    let notifications; // To import module within tests

    beforeEach(() => {
      jest.resetModules(); // Reset module to ensure fresh state if needed
      notifications = require('../notifications');
    });

    it('should create and append notification element with correct styles', () => {
      notifications.showNotification(message, 'success');
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockNotificationElement.style.cssText).toContain('background: rgba(16, 185, 129, 0.95)');
      expect(mockNotificationElement.style.cssText).toContain('position: fixed');
      expect(mockNotificationElement.textContent).toBe(message);
      expect(mockNotificationElement.setAttribute).toHaveBeenCalledWith('role', 'alert');
      expect(mockNotificationElement.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockNotificationElement);
    });
    
    it('should set opacity for fade-in animation', () => {
      notifications.showNotification(message);
      // Accessing offsetHeight happens before setting opacity to 1
      expect(mockNotificationElement.style.opacity).toBe('1');
    });

    it('should remove the notification after duration + fade out', () => {
      notifications.showNotification(message);
      
      expect(document.body.removeChild).not.toHaveBeenCalled();

      // Fast-forward past initial duration
      jest.advanceTimersByTime(3000);
      expect(mockNotificationElement.style.opacity).toBe('0');
      expect(document.body.removeChild).not.toHaveBeenCalled();

      // Fast-forward past fade-out duration
      jest.advanceTimersByTime(300);
      expect(document.body.contains).toHaveBeenCalledWith(mockNotificationElement);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockNotificationElement);
    });

    it('should use default message if none provided', () => {
      notifications.showNotification(null);
      expect(mockNotificationElement.textContent).toBe('Notification');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[showNotification] Empty message provided');
    });

    it('should default to success type and warn if invalid type provided', () => {
      notifications.showNotification(message, 'invalidType');
      expect(mockNotificationElement.style.cssText).toContain('background: rgba(16, 185, 129, 0.95)'); // Success color
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid notification type: invalidType'));
    });
    
     it('should handle errors during creation/appending and return null', () => {
       const error = new Error('DOM manipulation failed');
       document.body.appendChild.mockImplementationOnce(() => { throw error; });

       const result = notifications.showNotification(message);

       expect(result).toBeNull();
       expect(consoleErrorSpy).toHaveBeenCalledWith('[showNotification] Error showing notification:', error);
    });
  });

  // --- copyToClipboard Tests ---
  describe('copyToClipboard', () => {
    const textToCopy = 'Copy this!';
    let notifications; // To import module within tests

    beforeEach(() => {
      jest.resetModules(); // Reset module to get fresh instances
      notifications = require('../notifications');
    });

    it('should use navigator.clipboard.writeText in secure context', async () => {
      Object.defineProperty(window, 'isSecureContext', { value: true });
      const result = await notifications.copyToClipboard(textToCopy);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(textToCopy);
      expect(document.execCommand).not.toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledTimes(1);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockNotificationElement);
      expect(mockNotificationElement.textContent).toBe('Copied to clipboard!');
      expect(mockNotificationElement.style.cssText).toContain('rgba(16, 185, 129, 0.95)');
    });

    it('should use fallback (textarea + execCommand) in non-secure context', async () => {
      Object.defineProperty(window, 'isSecureContext', { value: false });
      const mockTextArea = { value: '', style: {}, setAttribute: jest.fn(), focus: jest.fn(), select: jest.fn(), remove: jest.fn() };
      let createCallCount = 0;
      document.createElement.mockImplementation(() => {
        createCallCount++;
        if (createCallCount === 1) return mockTextArea;
        return mockNotificationElement;
      });
      document.execCommand.mockReturnValueOnce(true);

      const result = await notifications.copyToClipboard(textToCopy);

      expect(result).toBe(true);
      expect(mockWriteText).not.toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('textarea');
      expect(mockTextArea.value).toBe(textToCopy);
      expect(mockTextArea.focus).toHaveBeenCalled();
      expect(mockTextArea.select).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(mockTextArea.remove).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledTimes(2);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockNotificationElement);
      expect(mockNotificationElement.textContent).toBe('Copied to clipboard!');
    });
    
    it('should use fallback if clipboard API is not available', async () => {
       global.navigator.clipboard = undefined; 
       Object.defineProperty(window, 'isSecureContext', { value: true }); 
       const mockTextArea = { value: '', style: {}, setAttribute: jest.fn(), focus: jest.fn(), select: jest.fn(), remove: jest.fn() };
       let createCallCount = 0;
       document.createElement.mockImplementation(() => {
         createCallCount++;
         if (createCallCount === 1) return mockTextArea;
         return mockNotificationElement;
       });
       document.execCommand.mockReturnValueOnce(true);
       
       const result = await notifications.copyToClipboard(textToCopy);
       
       expect(result).toBe(true);
       expect(document.execCommand).toHaveBeenCalledWith('copy');
       expect(document.createElement).toHaveBeenCalledTimes(2);
       expect(document.body.appendChild).toHaveBeenCalledWith(mockNotificationElement);
       expect(mockNotificationElement.textContent).toBe('Copied to clipboard!');
       
       global.navigator.clipboard = { writeText: mockWriteText };
    });

    it('should return false and show error notification if text is empty', async () => {
      const result = await notifications.copyToClipboard('');

      expect(result).toBe(false);
      expect(mockWriteText).not.toHaveBeenCalled();
      expect(document.execCommand).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('[copyToClipboard] Empty text provided');
      expect(document.createElement).toHaveBeenCalledTimes(1);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockNotificationElement);
      expect(mockNotificationElement.textContent).toBe('Nothing to copy');
      expect(mockNotificationElement.style.cssText).toContain('rgba(239, 68, 68, 0.95)');
    });

    it('should return false and show error notification if writeText fails', async () => {
      Object.defineProperty(window, 'isSecureContext', { value: true });
      const error = new Error('Write failed');
      mockWriteText.mockRejectedValueOnce(error);

      const result = await notifications.copyToClipboard(textToCopy);

      expect(result).toBe(false);
      expect(mockWriteText).toHaveBeenCalledWith(textToCopy);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[copyToClipboard] Failed to copy text:', error);
      expect(document.createElement).toHaveBeenCalledTimes(1);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockNotificationElement);
      expect(mockNotificationElement.textContent).toBe('Failed to copy to clipboard');
      expect(mockNotificationElement.style.cssText).toContain('rgba(239, 68, 68, 0.95)');
    });

    it('should return false and show error notification if execCommand fails', async () => {
      Object.defineProperty(window, 'isSecureContext', { value: false });
      const mockTextArea = { value: '', style: {}, setAttribute: jest.fn(), focus: jest.fn(), select: jest.fn(), remove: jest.fn() };
      let createCallCount = 0;
       document.createElement.mockImplementation(() => {
         createCallCount++;
         if (createCallCount === 1) return mockTextArea;
         return mockNotificationElement;
       });
      document.execCommand.mockReturnValueOnce(false);
      const expectedError = new Error('execCommand copy failed');

      const result = await notifications.copyToClipboard(textToCopy);

      expect(result).toBe(false);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[copyToClipboard] Failed to copy text:', expectedError);
      expect(document.createElement).toHaveBeenCalledTimes(2);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockNotificationElement);
      expect(mockNotificationElement.textContent).toBe('Failed to copy to clipboard');
      expect(mockNotificationElement.style.cssText).toContain('rgba(239, 68, 68, 0.95)');
    });
  });
}); 