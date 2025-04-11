import React from 'react';
import { render, screen } from '@testing-library/react';
import ReleaseNotesPage, { getStaticProps } from '../../pages/release-notes';
import fs from 'fs';
import path from 'path';

// Mock the styles to avoid issues with CSS modules in tests
jest.mock('@/styles/ReleaseNotes.module.scss', () => ({
  container: 'container',
  main: 'main',
  pageHeader: 'pageHeader',
  heading: 'heading',
  subtitle: 'subtitle',
  headerActions: 'headerActions',
  backLink: 'backLink',
  noteItem: 'noteItem'
}));

// Mock ReactMarkdown
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="markdown-content">{children}</div>
}));

// Mock fs and path modules
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/'))
}));

// Mock console methods
global.console = {
  warn: jest.fn(),
  error: jest.fn()
};

describe('ReleaseNotesPage', () => {
  describe('Component Rendering', () => {
    it('renders the page title and subtitle', () => {
      render(<ReleaseNotesPage notes={[]} />);
      
      expect(screen.getByText('Release Notes')).toBeInTheDocument();
      expect(screen.getByText('View version history and updates for DeFiTuna')).toBeInTheDocument();
    });

    it('shows message when no notes are available', () => {
      render(<ReleaseNotesPage notes={[]} />);
      
      expect(screen.getByText('No release notes available yet.')).toBeInTheDocument();
    });

    it('renders back link correctly', () => {
      render(<ReleaseNotesPage notes={[]} />);
      
      const backLink = screen.getByText('← Back to PnL Viewer');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('renders release notes content', () => {
      const mockNotes = [
        { version: '1.0.0', content: '# Version 1.0.0\n- Feature 1\n- Feature 2' },
        { version: '0.9.0', content: '# Version 0.9.0\n- Beta feature' }
      ];
      
      render(<ReleaseNotesPage notes={mockNotes} />);
      
      const markdownElements = screen.getAllByTestId('markdown-content');
      expect(markdownElements).toHaveLength(2);
      expect(markdownElements[0].textContent).toContain('# Version 1.0.0');
      expect(markdownElements[1].textContent).toContain('# Version 0.9.0');
    });
  });

  describe('getStaticProps', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.cwd = jest.fn(() => '/root');
    });

    it('returns empty notes array when directory does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      
      const { props } = await getStaticProps();
      
      expect(props.notes).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith("Release notes directory 'public/release-notes' does not exist.");
    });

    it('reads and sorts markdown files correctly', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['1.0.0.md', '0.9.0.md']);
      fs.readFileSync
        .mockReturnValueOnce('# Version 1.0.0\n- New features')
        .mockReturnValueOnce('# Version 0.9.0\n- Beta features');

      const { props } = await getStaticProps();

      expect(props.notes).toEqual([
        { version: '1.0.0', content: '# Version 1.0.0\n- New features' },
        { version: '0.9.0', content: '# Version 0.9.0\n- Beta features' }
      ]);
      expect(path.join).toHaveBeenCalledWith('/root', 'public', 'release-notes');
    });

    it('filters out non-markdown files', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['1.0.0.md', 'readme.txt', '0.9.0.md']);
      fs.readFileSync
        .mockReturnValueOnce('# Version 1.0.0')
        .mockReturnValueOnce('# Version 0.9.0');

      const { props } = await getStaticProps();

      expect(props.notes.length).toBe(2);
      expect(props.notes.map(n => n.version)).toEqual(['1.0.0', '0.9.0']);
    });

    it('handles errors gracefully', async () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('Test error');
      });

      const { props } = await getStaticProps();

      expect(props.notes).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error reading release notes directory or files:',
        expect.any(Error)
      );
    });

    it('includes revalidation time', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);

      const result = await getStaticProps();

      expect(result.revalidate).toBe(600);
    });
  });
});
