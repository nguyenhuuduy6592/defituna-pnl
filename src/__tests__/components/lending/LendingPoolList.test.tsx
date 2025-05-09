import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import LendingPoolList from '@/components/lending/LendingPoolList';
import { VaultData } from '@/utils/api/lending';

const mockVaults: VaultData[] = [
  {
    address: '0x123',
    mint: '0x123token',
    depositedFunds: {
      amount: '1000000000000000000',
      usdValue: 1000000
    },
    borrowedFunds: {
      amount: '750000000000000000',
      usdValue: 750000
    },
    supplyLimit: {
      amount: '2000000000000000000',
      usdValue: 2000000
    },
    utilization: 75,
    supplyApy: 5.5,
    borrowApy: 8.5,
    borrowedShares: '750000000000000000',
    depositedShares: '1000000000000000000',
    pythOracleFeedId: 'price_feed_1',
    pythOraclePriceUpdate: '1234567890'
  },
  {
    address: '0x456',
    mint: '0x456token',
    depositedFunds: {
      amount: '2000000000000000000',
      usdValue: 2000000
    },
    borrowedFunds: {
      amount: '1600000000000000000',
      usdValue: 1600000
    },
    supplyLimit: {
      amount: '3000000000000000000',
      usdValue: 3000000
    },
    utilization: 80,
    supplyApy: 6.5,
    borrowApy: 9.5,
    borrowedShares: '1600000000000000000',
    depositedShares: '2000000000000000000',
    pythOracleFeedId: 'price_feed_2',
    pythOraclePriceUpdate: '1234567891'
  }
];

describe('LendingPoolList', () => {
  it('renders loading state correctly', () => {
    render(
      <LendingPoolList
        vaults={[]}
        loading={true}
        error={null}
        filters={{}}
        onRetry={() => {}}
      />
    );
    
    expect(screen.getByText('Loading lending pools...')).toBeInTheDocument();
  });

  it('renders error state correctly and handles retry', () => {
    const mockRetry = jest.fn();
    const errorMessage = 'Failed to load pools';
    
    render(
      <LendingPoolList
        vaults={[]}
        loading={false}
        error={errorMessage}
        filters={{}}
        onRetry={mockRetry}
      />
    );
    
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no vaults are available', () => {
    render(
      <LendingPoolList
        vaults={[]}
        loading={false}
        error={null}
        filters={{}}
        onRetry={() => {}}
      />
    );
    
    expect(screen.getByText('No lending pools available at the moment.')).toBeInTheDocument();
  });

  it('renders vault list correctly', () => {
    render(
      <LendingPoolList
        vaults={mockVaults}
        loading={false}
        error={null}
        filters={{
          sortBy: 'tvl',
          sortOrder: 'desc'
        }}
        onRetry={() => {}}
      />
    );
    
    // Get all vault cards
    const vaultCards = screen.getAllByRole('article', { name: /lending pool card/i });
    expect(vaultCards).toHaveLength(2);

    // Check first vault's metrics
    const firstVault = vaultCards[0];
    expect(firstVault).toHaveTextContent('$1.00M'); // TVL
    expect(firstVault).toHaveTextContent('$750.00K'); // Borrowed
    expect(firstVault).toHaveTextContent('7500.00%'); // Utilization
    expect(firstVault).toHaveTextContent('550.00%'); // Supply APY
    expect(firstVault).toHaveTextContent('850.00%'); // Borrow APY
    expect(firstVault).toHaveTextContent('$2.00M'); // Supply Limit

    // Check second vault's metrics
    const secondVault = vaultCards[1];
    expect(secondVault).toHaveTextContent('$2.00M'); // TVL
    expect(secondVault).toHaveTextContent('$1.60M'); // Borrowed
    expect(secondVault).toHaveTextContent('8000.00%'); // Utilization
    expect(secondVault).toHaveTextContent('650.00%'); // Supply APY
    expect(secondVault).toHaveTextContent('950.00%'); // Borrow APY
    expect(secondVault).toHaveTextContent('$3.00M'); // Supply Limit
  });
}); 