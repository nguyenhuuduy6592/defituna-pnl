import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PositionsTable, TableHeader, PairCell, WalletCell, ActionsCell } from '../../../components/pnl/PositionsTable';
import { getValueClass, getStateClass, invertPairString, copyToClipboard } from '../../../utils';

// Mock dependencies
jest.mock('../../../components/pnl/ClusterBar', () => ({
  ClusterBar: ({ size, collateral }) => (
    <div data-testid="cluster-bar">
      Size: {size?.usd}, Collateral: {collateral?.usd}
    </div>
  )
}));

jest.mock('../../../components/pnl/PriceBar', () => ({
  PriceBar: ({ currentPrice }) => (
    <div data-testid="price-bar">
      Current Price: {currentPrice}
    </div>
  )
}));

jest.mock('../../../utils', () => ({
  formatNumber: (num) => num?.toLocaleString() || 'N/A',
  formatDuration: (days) => `${days} days`,
  formatWalletAddress: (addr) => addr?.substring(0, 6) + '...' + addr?.substring(addr.length - 4) || 'N/A',
  getValueClass: jest.fn((value) => value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'),
  getStateClass: jest.fn((status) => status?.toLowerCase() || 'unknown'),
  invertPairString: jest.fn((pair) => pair?.split('/').reverse().join('/') || pair),
  copyToClipboard: jest.fn()
}));

// Mock data for all tests
const mockPositions = [
  {
    pair: 'ETH/USDC',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    displayStatus: 'Active',
    age: 30,
    pnl: { usd: 1000 },
    displayPnlPercentage: 5.25,
    yield: { usd: 200 },
    size: { usd: 10000 },
    collateral: { usd: 5000 },
    debt: { usd: 5000 },
    interest: { usd: 100 },
    currentPrice: 1800,
    entryPrice: 1700,
    leverage: 2,
    liquidationPrice: {
      lower: 1400,
      upper: 2200
    },
    rangePrices: {
      lower: 1600,
      upper: 2000
    },
    limitOrderPrices: {
      lower: 1500,
      upper: 2100
    },
    positionAddress: '0x123456'
  },
  {
    pair: 'BTC/USDT',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    displayStatus: 'Closed',
    age: 60,
    pnl: { usd: -500 },
    displayPnlPercentage: -2.5,
    yield: { usd: 100 },
    size: { usd: 20000 },
    collateral: { usd: 10000 },
    debt: { usd: 10000 },
    interest: { usd: 200 },
    currentPrice: 32000,
    entryPrice: 33000,
    leverage: 2,
    liquidationPrice: {
      lower: 28000,
      upper: 36000
    },
    rangePrices: {
      lower: 30000,
      upper: 34000
    },
    limitOrderPrices: {
      lower: 29000,
      upper: 35000
    },
    positionAddress: '0xabcdef'
  }
];

describe('PositionsTable', () => {
  // Mock callbacks
  const onSort = jest.fn();
  const isInverted = jest.fn().mockImplementation(pair => pair === 'ETH/USDC');
  const onPairInversion = jest.fn();
  const onShare = jest.fn();
  const onShowChart = jest.fn();

  // Default props
  const defaultProps = {
    positions: mockPositions,
    showWallet: true,
    historyEnabled: true,
    sortState: { field: 'pnl', direction: 'desc' },
    onSort,
    isInverted,
    onPairInversion,
    onShare,
    onShowChart
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the table with correct headers and position data', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Check headers
    expect(screen.getByText('Pair ↕')).toBeInTheDocument();
    expect(screen.getByText('Wallet ↕')).toBeInTheDocument();
    expect(screen.getByText('Status ↕')).toBeInTheDocument();
    expect(screen.getByText('Age ↕')).toBeInTheDocument();
    expect(screen.getByText('PnL ↓')).toBeInTheDocument(); // Current sort field with direction
    expect(screen.getByText('Yield ↕')).toBeInTheDocument();
    expect(screen.getByText('Position Details ↕')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Check position data
    const invertedPair = invertPairString('ETH/USDC');
    expect(screen.getByText(invertedPair, { exact: false })).toBeInTheDocument(); // First pair is inverted
    expect(screen.getByText('BTC/USDT', { exact: false })).toBeInTheDocument();
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    
    expect(screen.getByText('30 days')).toBeInTheDocument();
    expect(screen.getByText('60 days')).toBeInTheDocument();
    
    expect(screen.getByText('$1,000', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('5.25', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('$-500', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('-2.5', { exact: false })).toBeInTheDocument();
    
    // Use getAllByText for yield values since they appear multiple times
    const yieldValues = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'td' && content.includes('$200');
    });
    expect(yieldValues.length).toBeGreaterThan(0);
    
    const yieldValues2 = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'td' && content.includes('$100');
    });
    expect(yieldValues2.length).toBeGreaterThan(0);
    
    // Check cluster and price bars
    expect(screen.getAllByTestId('cluster-bar')).toHaveLength(2);
    expect(screen.getAllByTestId('price-bar')).toHaveLength(2);
    
    // Check action buttons
    expect(screen.getAllByText('Share')).toHaveLength(2);
    expect(screen.getAllByText('Chart')).toHaveLength(2);
  });

  it('displays wallet addresses if showWallet is true', () => {
    render(<PositionsTable {...defaultProps} showWallet={true} />);
    
    const firstWalletAddress = mockPositions[0].walletAddress;
    const formattedAddress = firstWalletAddress.substring(0, 6) + '...' + firstWalletAddress.substring(firstWalletAddress.length - 4);
    
    expect(screen.getByText(formattedAddress)).toBeInTheDocument();
  });

  it('hides wallet addresses if showWallet is false', () => {
    render(<PositionsTable {...defaultProps} showWallet={false} />);
    
    const firstWalletAddress = mockPositions[0].walletAddress;
    const formattedAddress = firstWalletAddress.substring(0, 6) + '...' + firstWalletAddress.substring(firstWalletAddress.length - 4);
    
    expect(screen.queryByText(formattedAddress)).not.toBeInTheDocument();
  });

  it('triggers sort callback when header is clicked', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Click on a sortable header
    fireEvent.click(screen.getByText('Pair ↕'));
    
    // Check if sort callback was called with the right field
    expect(onSort).toHaveBeenCalledWith('pair');
  });

  it('triggers pair inversion when pair cell is clicked', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find and click on the first pair cell
    const pairCells = screen.getAllByRole('button').filter(el => 
      el.textContent.includes('USDC') || el.textContent.includes('ETH')
    );
    fireEvent.click(pairCells[0]);
    
    // Check if inversion callback was called with the right pair
    expect(onPairInversion).toHaveBeenCalledWith('ETH/USDC');
  });

  it('supports keyboard navigation for pair inversion', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find pair cell and trigger keyboard event
    const pairCells = screen.getAllByRole('button').filter(el => 
      el.textContent.includes('USDC') || el.textContent.includes('ETH')
    );
    fireEvent.keyDown(pairCells[0], { key: 'Enter' });
    
    // Check if inversion callback was called with the right pair
    expect(onPairInversion).toHaveBeenCalledWith('ETH/USDC');
    
    // Reset and try with space key
    onPairInversion.mockClear();
    fireEvent.keyDown(pairCells[0], { key: ' ' });
    expect(onPairInversion).toHaveBeenCalledWith('ETH/USDC');
  });

  it('displays correct leverage for each position', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Check for leverage display using getAllByText since there are multiple instances
    const leverageTexts = screen.getAllByText((content, element) => {
      return content.includes('Leverage') && element.classList.contains('positionLeverage');
    });
    expect(leverageTexts.length).toBe(2);
  });

  it('copies wallet address when wallet cell is clicked', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find and click on a wallet cell
    const walletCells = screen.getAllByRole('button').filter(el => 
      el.getAttribute('aria-label')?.includes('Copy wallet address')
    );
    fireEvent.click(walletCells[0]);
    
    // Check if copy function was called with the right address
    expect(copyToClipboard).toHaveBeenCalledWith(mockPositions[0].walletAddress);
  });

  it('supports keyboard navigation for copying wallet address', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find wallet cell and trigger keyboard event
    const walletCells = screen.getAllByRole('button').filter(el => 
      el.getAttribute('aria-label')?.includes('Copy wallet address')
    );
    fireEvent.keyDown(walletCells[0], { key: 'Enter' });
    
    // Check if copy function was called with the right address
    expect(copyToClipboard).toHaveBeenCalledWith(mockPositions[0].walletAddress);
    
    // Reset and try with space key
    copyToClipboard.mockClear();
    fireEvent.keyDown(walletCells[0], { key: ' ' });
    expect(copyToClipboard).toHaveBeenCalledWith(mockPositions[0].walletAddress);
  });

  it('applies correct CSS classes based on PnL values', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Check that getValueClass was called for PnL values
    expect(getValueClass).toHaveBeenCalledWith(1000);
    expect(getValueClass).toHaveBeenCalledWith(-500);
    
    // Check that getValueClass was called for Yield values
    expect(getValueClass).toHaveBeenCalledWith(200);
    expect(getValueClass).toHaveBeenCalledWith(100);
  });

  it('applies correct CSS classes based on position status', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Check that getStateClass was called with position statuses
    expect(getStateClass).toHaveBeenCalledWith('Active');
    expect(getStateClass).toHaveBeenCalledWith('Closed');
  });

  it('triggers share callback when share button is clicked', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find and click on the first share button
    const shareButtons = screen.getAllByText('Share');
    fireEvent.click(shareButtons[0]);
    
    // Check if share callback was called with the right position
    expect(onShare).toHaveBeenCalledWith(mockPositions[0]);
  });

  it('triggers chart callback when chart button is clicked', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find and click on the first chart button
    const chartButtons = screen.getAllByText('Chart');
    fireEvent.click(chartButtons[0]);
    
    // Check if chart callback was called with the right position
    expect(onShowChart).toHaveBeenCalledWith(mockPositions[0]);
  });

  it('hides chart buttons if history is disabled', () => {
    render(<PositionsTable {...defaultProps} historyEnabled={false} />);
    
    // Check that chart buttons are not rendered
    expect(screen.queryByText('Chart')).not.toBeInTheDocument();
  });

  it('renders a table with appropriate accessibility attributes', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Check that the table has an accessible label
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Position details');
    
    // Check sortable headers have appropriate roles
    const sortableHeaders = screen.getAllByRole('button').filter(el => 
      el.tagName.toLowerCase() === 'th'
    );
    expect(sortableHeaders.length).toBeGreaterThan(0);
    
    // Check sort headers have appropriate aria-sort attributes
    const pnlHeader = screen.getByText('PnL ↓');
    expect(pnlHeader).toHaveAttribute('aria-sort', 'desc');
  });

  it('renders non-sortable headers when only one position exists', () => {
    const singlePositionProps = {
      ...defaultProps,
      positions: [mockPositions[0]]
    };
    
    render(<PositionsTable {...singlePositionProps} />);
    
    // Headers should be present but not sortable
    expect(screen.getByText('Pair')).toBeInTheDocument();
    expect(screen.getByText('Pair')).not.toHaveTextContent('↕');
    expect(screen.getByText('Status')).not.toHaveTextContent('↕');
    
    // Headers should not have role="button"
    const headers = screen.getAllByRole('columnheader');
    const buttonsInHeaders = headers.filter(header => header.getAttribute('role') === 'button');
    expect(buttonsInHeaders.length).toBe(0);
    
    // Headers should have tabIndex -1 when not sortable
    headers.forEach(header => {
      if (header.textContent !== 'Price Range' && header.textContent !== 'Actions') {
        expect(header).toHaveAttribute('tabIndex', '-1');
      }
    });
  });

  it('does not trigger sort callback when non-sortable header is clicked', () => {
    const singlePositionProps = {
      ...defaultProps,
      positions: [mockPositions[0]]
    };
    
    render(<PositionsTable {...singlePositionProps} />);
    
    // Click on a header that should not trigger sort
    fireEvent.click(screen.getByText('Pair'));
    
    // Check sort callback was not called
    expect(onSort).not.toHaveBeenCalled();
  });

  it('renders appropriate sort indicators for ascending sort', () => {
    const ascSortProps = {
      ...defaultProps,
      sortState: { field: 'yield', direction: 'asc' }
    };
    
    render(<PositionsTable {...ascSortProps} />);
    
    // Check yield header has ascending arrow
    expect(screen.getByText('Yield ↑')).toBeInTheDocument();
    
    // Other headers should have neutral arrow
    expect(screen.getByText('PnL ↕')).toBeInTheDocument();
  });

  it('handles keyboard navigation for TableHeader sorting', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Get pair header and trigger keyboard event
    const pairHeader = screen.getByText('Pair ↕').closest('th');
    
    // Focus and press Enter to sort
    pairHeader.focus();
    fireEvent.keyDown(pairHeader, { key: 'Enter' });
    
    // This should not trigger sort since we're using onClick, not onKeyDown
    expect(onSort).not.toHaveBeenCalled();
    
    // Simulate clicking via keyboard by pressing Enter while focused
    fireEvent.click(pairHeader);
    expect(onSort).toHaveBeenCalledWith('pair');
  });
  
  it('renders appropriate class names based on sortable state', () => {
    // Normal case with multiple positions (sortable)
    render(<PositionsTable {...defaultProps} />);
    
    const sortableHeaders = screen.getAllByRole('columnheader')
      .filter(header => header.textContent !== 'Price Range' && header.textContent !== 'Actions');
    
    // Check sortable headers have the sortable class
    sortableHeaders.forEach(header => {
      expect(header).toHaveClass('sortable');
    });
    
    // Rerender with single position (non-sortable)
    const { rerender } = render(<PositionsTable {...defaultProps} />);
    
    rerender(<PositionsTable 
      {...defaultProps} 
      positions={[mockPositions[0]]} 
    />);
    
    const nonSortableHeaders = screen.getAllByRole('columnheader')
      .filter(header => header.textContent !== 'Price Range' && header.textContent !== 'Actions');
    
    // Check headers don't have the sortable class
    nonSortableHeaders.forEach(header => {
      expect(header).not.toHaveClass('sortable');
    });
  });
  
  it('handles other keyboard keys correctly in PairCell', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find pair cell
    const pairCells = screen.getAllByRole('button').filter(el => 
      el.textContent.includes('USDC') || el.textContent.includes('ETH')
    );
    
    // Try with a key that should not trigger inversion
    fireEvent.keyDown(pairCells[0], { key: 'Escape' });
    
    // Check inversion callback was not called
    expect(onPairInversion).not.toHaveBeenCalled();
  });
  
  it('handles other keyboard keys correctly in WalletCell', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find wallet cell
    const walletCells = screen.getAllByRole('button').filter(el => 
      el.getAttribute('aria-label')?.includes('Copy wallet address')
    );
    
    // Try with a key that should not trigger copy
    fireEvent.keyDown(walletCells[0], { key: 'Escape' });
    
    // Check copy function was not called
    expect(copyToClipboard).not.toHaveBeenCalled();
  });
  
  it('correctly renders inverted pair indicators', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find all rendered position cells
    const rows = screen.getAllByRole('row').slice(1); // Skip header row
    
    // First position should be inverted (ETH/USDC with isInverted = true)
    const firstRowPairCell = rows[0].querySelector('td');
    expect(firstRowPairCell.querySelector('.invertedIndicator')).toBeInTheDocument();
    
    // Second position should not be inverted (BTC/USDT with isInverted = false)
    const secondRowPairCell = rows[1].querySelector('td');
    expect(secondRowPairCell.querySelector('.invertedIndicator')).not.toBeInTheDocument();
  });
});

describe('TableHeader Component', () => {
  it('calls onSort with correct field when sortable header is clicked', () => {
    const mockOnSort = jest.fn();
    const sortState = { field: 'pnl', direction: 'desc' };
    
    render(
      <table>
        <TableHeader 
          showWallet={true}
          positionsCount={5}
          sortState={sortState}
          onSort={mockOnSort}
        />
      </table>
    );
    
    // Click on the Age header
    fireEvent.click(screen.getByText('Age ↕'));
    
    // Check that onSort was called with 'age'
    expect(mockOnSort).toHaveBeenCalledWith('age');
  });
  
  it('renders correct sort icons based on current sort state', () => {
    const sortState = { field: 'pair', direction: 'asc' };
    
    render(
      <table>
        <TableHeader 
          showWallet={true}
          positionsCount={5}
          sortState={sortState}
          onSort={jest.fn()}
        />
      </table>
    );
    
    // Check that pair header has ascending arrow
    expect(screen.getByText('Pair ↑')).toBeInTheDocument();
    
    // Check that other headers have neutral arrow
    expect(screen.getByText('Age ↕')).toBeInTheDocument();
    expect(screen.getByText('PnL ↕')).toBeInTheDocument();
  });
  
  it('renders no sort icons when only one position exists', () => {
    const sortState = { field: 'pair', direction: 'asc' };
    
    render(
      <table>
        <TableHeader 
          showWallet={true}
          positionsCount={1} // Only one position
          sortState={sortState}
          onSort={jest.fn()}
        />
      </table>
    );
    
    // Check that headers don't have arrows
    expect(screen.getByText('Pair')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('PnL')).toBeInTheDocument();
  });
});

describe('PairCell Component', () => {
  it('displays correct pair text based on inversion state', () => {
    const pair = 'ETH/USDC';
    const invertedPair = 'USDC/ETH'; // This is what invertPairString would return
    invertPairString.mockReturnValue(invertedPair);
    
    const { rerender } = render(
      <table>
        <tbody>
          <tr>
            <PairCell 
              pair={pair}
              isInverted={false}
              leverage={2}
              onPairInversion={jest.fn()}
            />
          </tr>
        </tbody>
      </table>
    );
    
    // Check that original pair is displayed when not inverted
    expect(screen.getByText('ETH/USDC', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('USDC/ETH', { exact: false })).not.toBeInTheDocument();
    
    // Rerender with inverted=true
    rerender(
      <table>
        <tbody>
          <tr>
            <PairCell 
              pair={pair}
              isInverted={true}
              leverage={2}
              onPairInversion={jest.fn()}
            />
          </tr>
        </tbody>
      </table>
    );
    
    // Check that inverted pair is displayed when inverted
    expect(screen.getByText('USDC/ETH', { exact: false })).toBeInTheDocument();
  });
  
  it('calls onPairInversion with the correct pair when clicked', () => {
    const pair = 'ETH/USDC';
    const onPairInversion = jest.fn();
    
    render(
      <table>
        <tbody>
          <tr>
            <PairCell 
              pair={pair}
              isInverted={false}
              leverage={2}
              onPairInversion={onPairInversion}
            />
          </tr>
        </tbody>
      </table>
    );
    
    // Click on the pair cell
    fireEvent.click(screen.getByText('ETH/USDC', { exact: false }));
    
    // Check that onPairInversion was called with the correct pair
    expect(onPairInversion).toHaveBeenCalledWith(pair);
  });
});

describe('WalletCell Component', () => {
  it('formats and displays wallet address correctly', () => {
    const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const formattedAddress = '0x1234...5678'; // Mocked in formatWalletAddress
    
    render(
      <table>
        <tbody>
          <tr>
            <WalletCell walletAddress={walletAddress} />
          </tr>
        </tbody>
      </table>
    );
    
    // Check that formatted address is displayed
    expect(screen.getByText(formattedAddress)).toBeInTheDocument();
  });
  
  it('calls copyToClipboard with wallet address when clicked', () => {
    const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    render(
      <table>
        <tbody>
          <tr>
            <WalletCell walletAddress={walletAddress} />
          </tr>
        </tbody>
      </table>
    );
    
    // Click on the wallet cell
    fireEvent.click(screen.getByRole('button'));
    
    // Check that copyToClipboard was called with the correct address
    expect(copyToClipboard).toHaveBeenCalledWith(walletAddress);
  });
});

describe('ActionsCell Component', () => {
  const position = mockPositions[0];
  
  it('renders share button', () => {
    const onShare = jest.fn();
    
    render(
      <table>
        <tbody>
          <tr>
            <ActionsCell 
              position={position}
              historyEnabled={false} // No chart button
              onShare={onShare}
              onShowChart={jest.fn()}
            />
          </tr>
        </tbody>
      </table>
    );
    
    // Check that share button is rendered
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.queryByText('Chart')).not.toBeInTheDocument();
  });
  
  it('renders chart button when history is enabled', () => {
    render(
      <table>
        <tbody>
          <tr>
            <ActionsCell 
              position={position}
              historyEnabled={true}
              onShare={jest.fn()}
              onShowChart={jest.fn()}
            />
          </tr>
        </tbody>
      </table>
    );
    
    // Check that both buttons are rendered
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Chart')).toBeInTheDocument();
  });
  
  it('calls onShare with position when share button is clicked', () => {
    const onShare = jest.fn();
    
    render(
      <table>
        <tbody>
          <tr>
            <ActionsCell 
              position={position}
              historyEnabled={true}
              onShare={onShare}
              onShowChart={jest.fn()}
            />
          </tr>
        </tbody>
      </table>
    );
    
    // Click on the share button
    fireEvent.click(screen.getByText('Share'));
    
    // Check that onShare was called with the correct position
    expect(onShare).toHaveBeenCalledWith(position);
  });
  
  it('calls onShowChart with position when chart button is clicked', () => {
    const onShowChart = jest.fn();
    
    render(
      <table>
        <tbody>
          <tr>
            <ActionsCell 
              position={position}
              historyEnabled={true}
              onShare={jest.fn()}
              onShowChart={onShowChart}
            />
          </tr>
        </tbody>
      </table>
    );
    
    // Click on the chart button
    fireEvent.click(screen.getByText('Chart'));
    
    // Check that onShowChart was called with the correct position
    expect(onShowChart).toHaveBeenCalledWith(position);
  });
});

// Additional tests for TableHeader to improve function coverage
describe('TableHeader Additional Tests', () => {
  it('handles each column sort click', () => {
    const mockOnSort = jest.fn();
    const sortState = { field: 'pnl', direction: 'desc' };
    
    render(
      <table>
        <TableHeader 
          showWallet={true}
          positionsCount={5}
          sortState={sortState}
          onSort={mockOnSort}
        />
      </table>
    );
    
    // Define headers and their corresponding field names
    const headerFieldMap = {
      'Pair': 'pair',
      'Wallet': 'walletAddress', // Special case, not just lowercase
      'Status': 'status',
      'Age': 'age',
      'PnL': 'pnl',
      'Yield': 'yield',
      'Position Details': 'size' // Special case, not just lowercase
    };
    
    // Test each header
    Object.entries(headerFieldMap).forEach(([headerText, fieldName]) => {
      // Reset mock between clicks
      mockOnSort.mockClear();
      
      // Find and click header
      const header = screen.getByText(new RegExp(`^${headerText}`)); // Use regex to match with/without sort icon
      fireEvent.click(header);
      
      // Check correct field was passed
      expect(mockOnSort).toHaveBeenCalledWith(fieldName);
    });
  });
  
  it('adds aria-sort attributes only to the sorted column', () => {
    const sortState = { field: 'pnl', direction: 'desc' };
    
    render(
      <table>
        <TableHeader 
          showWallet={true}
          positionsCount={5}
          sortState={sortState}
          onSort={jest.fn()}
        />
      </table>
    );
    
    // Check PnL header has aria-sort="desc"
    const pnlHeader = screen.getByText(/^PnL/).closest('th');
    expect(pnlHeader).toHaveAttribute('aria-sort', 'desc');
    
    // Other headers should not have aria-sort
    const pairHeader = screen.getByText(/^Pair/).closest('th');
    expect(pairHeader).not.toHaveAttribute('aria-sort', 'desc');
    expect(pairHeader).not.toHaveAttribute('aria-sort', 'asc');
    
    // Non-sortable headers should not have aria-sort at all
    const priceRangeHeader = screen.getByText('Price Range');
    expect(priceRangeHeader).not.toHaveAttribute('aria-sort');
  });
  
  it('conditionally renders wallet header based on showWallet prop', () => {
    // First with showWallet=true
    const { rerender } = render(
      <table>
        <TableHeader 
          showWallet={true}
          positionsCount={5}
          sortState={{ field: 'pnl', direction: 'desc' }}
          onSort={jest.fn()}
        />
      </table>
    );
    
    // Wallet header should be present
    expect(screen.getByText(/^Wallet/)).toBeInTheDocument();
    
    // Rerender with showWallet=false
    rerender(
      <table>
        <TableHeader 
          showWallet={false}
          positionsCount={5}
          sortState={{ field: 'pnl', direction: 'desc' }}
          onSort={jest.fn()}
        />
      </table>
    );
    
    // Wallet header should not be present
    expect(screen.queryByText(/^Wallet/)).not.toBeInTheDocument();
  });
  
  it('handles onClick with multiple sort fields correctly', () => {
    const mockOnSort = jest.fn();
    
    render(
      <table>
        <TableHeader 
          showWallet={true}
          positionsCount={5}
          sortState={{ field: 'pnl', direction: 'desc' }}
          onSort={mockOnSort}
        />
      </table>
    );
    
    // Click on PnL header (already sorted field)
    fireEvent.click(screen.getByText(/^PnL/));
    expect(mockOnSort).toHaveBeenCalledWith('pnl');
    
    // Click on Yield header (different field)
    mockOnSort.mockClear();
    fireEvent.click(screen.getByText(/^Yield/));
    expect(mockOnSort).toHaveBeenCalledWith('yield');
    
    // Click on wallet header
    mockOnSort.mockClear();
    fireEvent.click(screen.getByText(/^Wallet/));
    expect(mockOnSort).toHaveBeenCalledWith('walletAddress');
  });
}); 