import React from 'react';
import { render, act } from '@testing-library/react';
import App from '../../pages/_app'; 
import { ComparisonProvider } from '../../contexts/ComparisonContext';

// Mock the ComparisonProvider as its internal logic isn't the focus here
jest.mock('../../contexts/ComparisonContext', () => ({
  ComparisonProvider: ({ children }) => <div data-testid="mock-comparison-provider">{children}</div>,
}));

// Mock navigator.serviceWorker
global.navigator.serviceWorker = {
  register: jest.fn(() => Promise.resolve({ scope: '/' })),
};

global.console = {
  log: jest.fn(), 
  error: jest.fn(), 
  warn: jest.fn(), 
};

describe('App Component (_app.js)', () => {
  // Mock Component and pageProps
  const MockComponent = () => <div data-testid="mock-page-component">Mock Page</div>;
  const mockPageProps = { prop1: 'test' };

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    // Set to production to test service worker registration
    process.env.NODE_ENV = 'production'; 
  });
  
  afterEach(() => {
    // Restore NODE_ENV if needed, though usually tests run isolated
    process.env.NODE_ENV = 'test'; 
  });

  it('renders the Component passed via props', () => {
    const { getByTestId } = render(<App Component={MockComponent} pageProps={mockPageProps} />);
    expect(getByTestId('mock-page-component')).toBeInTheDocument();
  });

  it('wraps the Component with ComparisonProvider', () => {
    const { getByTestId } = render(<App Component={MockComponent} pageProps={mockPageProps} />);
    expect(getByTestId('mock-comparison-provider')).toBeInTheDocument();
    // Check that the mock page component is inside the provider
    expect(getByTestId('mock-comparison-provider')).toContainElement(getByTestId('mock-page-component'));
  });

  it('passes pageProps to the Component', () => {
    // We can't directly check props of MockComponent easily in the rendered output.
    // This test is more conceptual or would require a more complex setup to verify.
    // For now, we trust React's rendering process.
    // A more involved test could involve MockComponent using the props.
    const { getByText } = render(<App Component={({prop1}) => <div>{prop1}</div>} pageProps={mockPageProps} />);
    expect(getByText('test')).toBeInTheDocument(); 
  });

  it('attempts to register service worker in production', () => {
    // Fake window.addEventListener for 'load' event
    const map = {};
    window.addEventListener = jest.fn((event, cb) => {
      map[event] = cb;
    });

    render(<App Component={MockComponent} pageProps={mockPageProps} />);

    // Simulate the window load event
    act(() => {
       map.load();
    });

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    // We expect the console log upon successful registration (async)
    // Need to await the promise resolution
    return Promise.resolve().then(() => {
      expect(console.log).toHaveBeenCalledWith('Service Worker registered:', { scope: '/' });
    });
  });

  it('does not attempt to register service worker if not in production', () => {
    process.env.NODE_ENV = 'development'; // Set to non-production

    // Fake window.addEventListener
    const map = {};
    window.addEventListener = jest.fn((event, cb) => {
      map[event] = cb;
    });

    render(<App Component={MockComponent} pageProps={mockPageProps} />);

    // Simulate window load event
    act(() => {
       if (map.load) map.load();
    });

    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
  });
  
  it('logs an error if service worker registration fails', async () => {
    const registrationError = new Error('Registration Failed');
    navigator.serviceWorker.register.mockImplementationOnce(() => Promise.reject(registrationError));
    
    // Fake window.addEventListener
    const map = {};
    window.addEventListener = jest.fn((event, cb) => {
      map[event] = cb;
    });

    render(<App Component={MockComponent} pageProps={mockPageProps} />);

    // Simulate window load event
    act(() => {
       map.load();
    });
    
    // Wait for the promise rejection to be handled
    await act(async () => {
      await Promise.resolve(); // Allow microtasks to run
    });

    expect(console.error).toHaveBeenCalledWith('Service Worker registration failed:', registrationError);
  });
}); 