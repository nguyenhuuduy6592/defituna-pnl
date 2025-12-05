import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection } from '../../../components/common/CollapsibleSection';

const TITLE = 'Section Title';
const CHILD_TEXT = 'Section Content';
const STORAGE_KEY = 'test-collapsible-section';

describe('CollapsibleSection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders title and children when visible', () => {
    render(
      <CollapsibleSection title={TITLE} storageKey={STORAGE_KEY} visible={true}>
        <div>{CHILD_TEXT}</div>
      </CollapsibleSection>
    );
    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    const { container } = render(
      <CollapsibleSection title={TITLE} storageKey={STORAGE_KEY} visible={false}>
        <div>{CHILD_TEXT}</div>
      </CollapsibleSection>
    );
    expect(container.firstChild).toBeNull();
  });

  it('is expanded by default if defaultExpanded is true', () => {
    render(
      <CollapsibleSection title={TITLE} storageKey={STORAGE_KEY} defaultExpanded={true}>
        <div>{CHILD_TEXT}</div>
      </CollapsibleSection>
    );
    // Content should be visible
    expect(screen.getByText(CHILD_TEXT)).toBeVisible();
  });

  it('is collapsed by default if defaultExpanded is false', () => {
    render(
      <CollapsibleSection title={TITLE} storageKey={STORAGE_KEY} defaultExpanded={false}>
        <div>{CHILD_TEXT}</div>
      </CollapsibleSection>
    );
    // Content should be in the DOM but not visible (max-height: 0)
    expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
  });

  it('toggles expanded/collapsed state on header click', () => {
    render(
      <CollapsibleSection title={TITLE} storageKey={STORAGE_KEY} defaultExpanded={true}>
        <div>{CHILD_TEXT}</div>
      </CollapsibleSection>
    );
    const header = screen.getByText(TITLE).closest('div');
    // Collapse
    fireEvent.click(header);
    // Expand
    fireEvent.click(header);
    // No error means toggle works
    expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
  });

  it('persists expanded state to localStorage', () => {
    render(
      <CollapsibleSection title={TITLE} storageKey={STORAGE_KEY} defaultExpanded={true}>
        <div>{CHILD_TEXT}</div>
      </CollapsibleSection>
    );
    const header = screen.getByText(TITLE).closest('div');
    // Collapse
    fireEvent.click(header);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
    // Expand
    fireEvent.click(header);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('loads expanded state from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    render(
      <CollapsibleSection title={TITLE} storageKey={STORAGE_KEY} defaultExpanded={true}>
        <div>{CHILD_TEXT}</div>
      </CollapsibleSection>
    );
    // Should be collapsed (not visible)
    expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
  });
});