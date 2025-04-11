import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DonationFooter } from '@/components/pnl/DonationFooter';
import { copyToClipboard, formatWalletAddress } from '@/utils';

// Mock the utility functions
jest.mock('@/utils', () => ({
  copyToClipboard: jest.fn(),
  formatWalletAddress: jest.fn((address) => `formatted-${address}`)
}));

// Mock styles
jest.mock('@/components/pnl/DonationFooter.module.scss', () => ({
  donationFooter: 'donationFooter-mock',
  title: 'title-mock',
  address: 'address-mock',
  description: 'description-mock'
}));

describe('DonationFooter Component', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DONATION_WALLET: '0x1234567890abcdef1234567890abcdef12345678'
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders nothing when visible is false', () => {
    const { container } = render(<DonationFooter visible={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when donation wallet is not defined', () => {
    // Override donation wallet to be undefined
    process.env.NEXT_PUBLIC_DONATION_WALLET = undefined;
    
    const { container } = render(<DonationFooter visible={true} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders donation footer when visible and wallet is defined', () => {
    render(<DonationFooter visible={true} />);
    
    expect(screen.getByText('Support me')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('formatted-0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    expect(screen.getByText(/Your support helps keep the tool running/)).toBeInTheDocument();
  });

  it('calls copyToClipboard when address is clicked', () => {
    render(<DonationFooter visible={true} />);
    
    const addressButton = screen.getByRole('button');
    fireEvent.click(addressButton);
    
    expect(copyToClipboard).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
  });

  it('applies correct CSS classes to elements', () => {
    render(<DonationFooter visible={true} />);
    
    const donationFooter = screen.getByText('Support me').parentElement;
    expect(donationFooter).toHaveClass('donationFooter-mock');
    
    const title = screen.getByText('Support me');
    expect(title).toHaveClass('title-mock');
    
    const address = screen.getByRole('button');
    expect(address).toHaveClass('address-mock');
    
    const description = screen.getByText(/Your support helps keep the tool running/);
    expect(description).toHaveClass('description-mock');
  });

  it('formats the wallet address using the formatter utility', () => {
    render(<DonationFooter visible={true} />);
    
    expect(formatWalletAddress).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
    expect(screen.getByRole('button')).toHaveTextContent('formatted-0x1234567890abcdef1234567890abcdef12345678');
  });

  it('applies correct accessibility attributes to address button', () => {
    render(<DonationFooter visible={true} />);
    
    const addressButton = screen.getByRole('button');
    expect(addressButton).toHaveAttribute('tabIndex', '0');
    expect(addressButton).toHaveAttribute('aria-label', 'Copy donation wallet address');
    expect(addressButton).toHaveAttribute('title', 'Click to copy');
  });

  it('uses default value for visible prop if not provided', () => {
    // Not passing the visible prop should default to false
    const { container } = render(<DonationFooter />);
    expect(container).toBeEmptyDOMElement();
  });
}); 