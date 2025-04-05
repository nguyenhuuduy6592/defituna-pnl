import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '/',
    route: '/',
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Custom render function that includes common providers
const customRender = (ui, options = {}) => {
  const AllTheProviders = ({ children }) => {
    return (
      // Add any providers needed for components here
      <React.Fragment>
        {children}
      </React.Fragment>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Export userEvent
export { userEvent };

// Common test data
export const mockPool = {
  address: 'pool1',
  tokenA: { symbol: 'TOKEN1', decimals: 9 },
  tokenB: { symbol: 'TOKEN2', decimals: 6 },
  tvl_usdc: '100000',
  metrics: {
    '24h': {
      feeAPR: 0.1,
      volumeTVLRatio: 0.5,
      volatility: 'medium'
    }
  }
};

// Helper to simulate window resize
export const resizeWindow = (width, height) => {
  window.innerWidth = width;
  window.innerHeight = height;
  window.dispatchEvent(new Event('resize'));
};

// Helper to wait for all promises to resolve
export const waitForPromises = () => new Promise(resolve => setImmediate(resolve));

// Helper to mock API responses
export const mockApiResponse = (data, error = null) => {
  if (error) {
    return Promise.reject(error);
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data)
  });
};

// Helper to create a mock ref
export const createMockRef = (value = null) => ({
  current: value,
  get value() {
    return this.current;
  },
  set value(v) {
    this.current = v;
  }
}); 