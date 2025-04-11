// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util';
import 'whatwg-fetch'; // Polyfill for fetch

// Explicitly polyfill TextEncoder and TextDecoder for JSDOM
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set environment variables for tests
process.env.DEFITUNA_API_URL = 'http://mock-defituna-api.com';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  }
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})

// Polyfill for MessageChannel (needed for JSDOM environment)
if (typeof MessageChannel === 'undefined') {
  class MessageChannelMock {
    port1 = {
      onmessage: null,
      postMessage: (message) => {
        if (this.port2.onmessage) {
          // Simulate async behavior
          setTimeout(() => this.port2.onmessage({ data: message }), 0);
        }
      },
      start: () => {},
      close: () => {},
    };
    port2 = {
      onmessage: null,
      postMessage: (message) => {
        if (this.port1.onmessage) {
          // Simulate async behavior
          setTimeout(() => this.port1.onmessage({ data: message }), 0);
        }
      },
      start: () => {},
      close: () => {},
    };
  }
  
  global.MessageChannel = MessageChannelMock;
}



// Mock IndexedDB utilities with default implementations
const mockIndexedDB = {
  initializeDB: jest.fn().mockResolvedValue({}),
  getData: jest.fn().mockImplementation(() => Promise.resolve(null)),
  saveData: jest.fn().mockResolvedValue(true),
  // Add mocks for historical data functions
  savePositionSnapshot: jest.fn().mockResolvedValue(true),
  getPositionHistory: jest.fn().mockResolvedValue([]),
  deletePositionHistory: jest.fn().mockResolvedValue(true),
  clearAllHistory: jest.fn().mockResolvedValue(true),
  // Add STORE_NAMES if they are used directly in tests
  STORE_NAMES: {
    SETTINGS: 'settings',
    HISTORY: 'history' // Assuming a history store name
  }
};

// Auto-mock the indexedDB module
jest.mock('@/utils/indexedDB', () => mockIndexedDB);

// Export the mock for direct access in tests
module.exports = mockIndexedDB;

// Reset all mocks to their default state
export const resetIndexedDBMocks = () => {
  mockIndexedDB.initializeDB.mockClear();
  mockIndexedDB.getData.mockImplementation(() => Promise.resolve(null));
  mockIndexedDB.saveData.mockImplementation(() => Promise.resolve(true));
};

// Mock successful data retrieval
export const mockGetData = (key, value) => {
  mockIndexedDB.getData.mockImplementation((db, storeName, dataKey) => {
    if (dataKey === key) {
      return Promise.resolve({ value });
    }
    return Promise.resolve(null);
  });
};

// Mock failed data retrieval
export const mockGetDataFailure = (error = new Error('IndexedDB is not available')) => {
  mockIndexedDB.getData.mockImplementation(() => Promise.reject(error));
};

// Mock failed data saving
export const mockSaveDataFailure = (error = new Error('IndexedDB is not available')) => {
  mockIndexedDB.saveData.mockImplementation(() => Promise.reject(error));
};

// Jest mock setup
export const setupIndexedDBMock = () => {
  jest.mock('@/utils/indexedDB', () => mockIndexedDB);
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Reset mocks to default behavior
  mockIndexedDB.initializeDB.mockResolvedValue({});
  mockIndexedDB.getData.mockImplementation(() => Promise.resolve(null));
  mockIndexedDB.saveData.mockResolvedValue(true);
  mockIndexedDB.savePositionSnapshot.mockResolvedValue(true);
  mockIndexedDB.getPositionHistory.mockResolvedValue([]);
  mockIndexedDB.deletePositionHistory.mockResolvedValue(true);
  mockIndexedDB.clearAllHistory.mockResolvedValue(true);
}); 
