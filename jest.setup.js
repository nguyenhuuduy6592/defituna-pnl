// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
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
    };
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    const { src, alt = '', width, height, ...restProps } = props;
    return (
      <div
        data-testid="mock-next-image"
        data-src={src}
        data-alt={alt}
        data-width={width}
        data-height={height}
        {...restProps}
      />
    );
  },
}));

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

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

// Mock IntersectionObserver if needed by components (uncomment if necessary)
/*
class IntersectionObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});
*/
