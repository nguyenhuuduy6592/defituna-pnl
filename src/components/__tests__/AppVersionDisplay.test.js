import React from 'react';
import { render, screen } from '@testing-library/react';
import AppVersionDisplay from '../AppVersionDisplay';

// Mock the styles to avoid issues with CSS modules in tests
jest.mock('@/styles/AppVersion.module.scss', () => ({
  versionContainer: 'versionContainer',
  versionText: 'versionText',
  releaseNotesLink: 'releaseNotesLink'
}));

describe('AppVersionDisplay', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear environment before each test
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_APP_VERSION;
  });

  afterAll(() => {
    // Restore environment after all tests
    process.env = originalEnv;
  });

  it('renders version when NEXT_PUBLIC_APP_VERSION is set', () => {
    process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0';
    render(<AppVersionDisplay />);
    
    expect(screen.getByText('Version: 1.0.0')).toBeInTheDocument();
    expect(screen.getByText('(Release Notes)')).toBeInTheDocument();
  });

  it('does not render when NEXT_PUBLIC_APP_VERSION is not set', () => {
    render(<AppVersionDisplay />);
    
    expect(screen.queryByText(/Version:/)).not.toBeInTheDocument();
    expect(screen.queryByText('(Release Notes)')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0';
    render(<AppVersionDisplay />);
    
    expect(screen.getByTestId('version-container')).toHaveClass('versionContainer');
    expect(screen.getByTestId('version-text')).toHaveClass('versionText');
    expect(screen.getByTestId('release-notes-link')).toHaveClass('releaseNotesLink');
  });

  it('includes a link to release notes', () => {
    process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0';
    render(<AppVersionDisplay />);
    
    const link = screen.getByText('(Release Notes)');
    expect(link).toHaveAttribute('href', '/release-notes');
  });
});
