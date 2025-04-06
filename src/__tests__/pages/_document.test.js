import 'jest-environment-jsdom'; // Explicitly import jsdom environment
import React from 'react';
import { render, screen } from '@testing-library/react';
import Document, { Html, Head, Main, NextScript } from '../../pages/_document';
import { renderToStaticMarkup } from 'react-dom/server';

// Mock Next.js internal components used by Document
jest.mock('next/document', () => ({
  ...jest.requireActual('next/document'), // Use actual implementation for others
  Html: ({ children }) => <html lang="en">{children}</html>,
  Head: ({ children }) => <head>{children}</head>,
  Main: () => <main data-testid="mock-main" />, 
  NextScript: () => <script data-testid="mock-next-script" />,
}));

describe('Custom Document (_document.js)', () => {
  it('renders the basic HTML structure with lang="en" on Html tag', () => {
    const { container } = render(<Document />);
    const htmlElement = container.querySelector('html');
    expect(htmlElement).toBeInTheDocument();
    expect(htmlElement).toHaveAttribute('lang', 'en');
  });

  it('renders Head, Main, and NextScript components', () => {
    const { container, getByTestId } = render(<Document />);
    expect(container.querySelector('head')).toBeInTheDocument();
    expect(getByTestId('mock-main')).toBeInTheDocument();
    expect(getByTestId('mock-next-script')).toBeInTheDocument();
  });

  it('includes essential meta tags in the Head', () => {
    // Use renderToStaticMarkup for easier checking of Head contents
    const markup = renderToStaticMarkup(<Document />);
    
    expect(markup).toContain('<meta name="application-name" content="DeFi Tuna PnL"/>');
    expect(markup).toContain('<meta name="description" content="Track your DeFi positions and PnL"/>');
    expect(markup).toContain('<meta name="theme-color" content="#0A1928"/>');
    expect(markup).toContain('<meta name="mobile-web-app-capable" content="yes"/>');
    expect(markup).toContain('<meta name="apple-mobile-web-app-capable" content="yes"/>');
    expect(markup).toContain('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>');
    expect(markup).toContain('<meta name="apple-mobile-web-app-title" content="DeFi Tuna"/>');
  });

  it('includes manifest, favicon, and apple-touch-icon links in the Head', () => {
    const markup = renderToStaticMarkup(<Document />);

    expect(markup).toContain('<link rel="apple-touch-icon" href="/icon-192x192.png"/>');
    expect(markup).toContain('<link rel="manifest" href="/manifest.json"/>');
    expect(markup).toContain('<link rel="icon" type="image/png" href="/favicon.svg"/>');
  });
}); 