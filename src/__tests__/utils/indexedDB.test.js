// Mock IDBKeyRange
global.IDBKeyRange = {
  lowerBound: jest.fn(value => ({ lower: value })),
  upperBound: jest.fn(value => ({ upper: value }))
};

import {
  DB_NAME,
  DB_VERSION,
  STORE_NAME,
  DEFAULT_RETENTION_DAYS,
  initializeDB,
  savePositionSnapshot,
  getPositionHistory,
  cleanupOldData
} from '../../utils/indexedDB';

// Mock indexedDB
const mockDB = {
  transaction: jest.fn(),
  objectStoreNames: {
    contains: jest.fn()
  }
};

const mockObjectStore = {
  add: jest.fn(),
  createIndex: jest.fn(),
  index: jest.fn()
};

const mockTransaction = {
  objectStore: jest.fn(),
  done: Promise.resolve()
};

const mockIndex = {
  getAll: jest.fn(),
  openCursor: jest.fn()
};

// Mock idb's openDB
jest.mock('idb', () => ({
  openDB: jest.fn()
}));

// Mock console methods
global.console = {
  error: jest.fn()
};

describe('IndexedDB Utils', () => {
  const mockCursor = {
    delete: jest.fn().mockResolvedValue(undefined),
    continue: jest.fn().mockResolvedValue(null)
  };

  const setupMocks = () => {
    mockDB.transaction.mockReturnValue(mockTransaction);
    mockTransaction.objectStore.mockReturnValue(mockObjectStore);
    mockObjectStore.index.mockReturnValue(mockIndex);
    mockIndex.openCursor.mockResolvedValue(mockCursor);
    mockIndex.getAll.mockResolvedValue([]);
  };
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    setupMocks();
  });

  describe('initializeDB', () => {
    it('initializes database successfully', async () => {
      const mockUpgradeDB = {
        objectStoreNames: { contains: jest.fn().mockReturnValue(false) },
        createObjectStore: jest.fn().mockReturnValue(mockObjectStore)
      };

      require('idb').openDB.mockResolvedValue(mockDB);

      const result = await initializeDB();

      expect(require('idb').openDB).toHaveBeenCalledWith(DB_NAME, DB_VERSION, expect.any(Object));
      expect(result).toBe(mockDB);
    });

    it('handles initialization error', async () => {
      require('idb').openDB.mockRejectedValue(new Error('DB Error'));

      const result = await initializeDB();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to initialize IndexedDB:', expect.any(Error));
    });
  });

  describe('savePositionSnapshot', () => {
    const mockPositions = [
      {
        pair: 'ETH-USDC',
        positionAddress: '0x123',
        value: 100
      }
    ];

    beforeEach(() => {
      mockObjectStore.add.mockResolvedValue(undefined);
    });

    it('saves positions successfully', async () => {
      const timestamp = Date.now();
      const result = await savePositionSnapshot(mockDB, mockPositions, timestamp);

      expect(result).toBe(true);
      expect(mockDB.transaction).toHaveBeenCalledWith(STORE_NAME, 'readwrite');
      expect(mockObjectStore.add).toHaveBeenCalledWith({
        ...mockPositions[0],
        id: `${mockPositions[0].pair}-${mockPositions[0].positionAddress}`,
        timestamp
      });
    });

    it('handles invalid db parameter', async () => {
      const result = await savePositionSnapshot(null, mockPositions);
      expect(result).toBe(false);
    });

    it('handles invalid positions array', async () => {
      const result = await savePositionSnapshot(mockDB, 'not-an-array');
      expect(result).toBe(false);
    });

    it('skips invalid positions in array', async () => {
      const invalidPositions = [
        { invalid: true },
        { pair: 'ETH-USDC', positionAddress: '0x123' }
      ];

      await savePositionSnapshot(mockDB, invalidPositions);

      expect(mockObjectStore.add).toHaveBeenCalledTimes(1);
    });

    it('handles save error', async () => {
      mockObjectStore.add.mockRejectedValue(new Error('Save Error'));

      const result = await savePositionSnapshot(mockDB, mockPositions);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to save position snapshot:', expect.any(Error));
    });
  });

  describe('getPositionHistory', () => {
    const mockHistory = [
      { id: 'pos1', timestamp: Date.now() - 1000 },
      { id: 'pos2', timestamp: Date.now() }
    ];

    beforeEach(() => {
      mockIndex.getAll.mockResolvedValue(mockHistory);
    });

    it('retrieves history successfully', async () => {
      const result = await getPositionHistory(mockDB, 'pos1');

      expect(result).toEqual([mockHistory[0]]);
      expect(mockDB.transaction).toHaveBeenCalledWith(STORE_NAME, 'readonly');
      expect(mockIndex.getAll).toHaveBeenCalled();
    });

    it('handles invalid db parameter', async () => {
      const result = await getPositionHistory(null, 'pos1');
      expect(result).toEqual([]);
    });

    it('filters by time range when provided', async () => {
      const timeRange = 3600000; // 1 hour
      const now = Date.now();
      Date.now = jest.fn(() => now);
      
      await getPositionHistory(mockDB, 'pos1', timeRange);

      expect(mockIndex.getAll).toHaveBeenCalledWith({ lower: now - timeRange });
      Date.now = global.Date.now; // Restore original Date.now
    });

    it('handles retrieval error', async () => {
      mockIndex.getAll.mockRejectedValue(new Error('Retrieval Error'));

      const result = await getPositionHistory(mockDB, 'pos1');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to get position history:', expect.any(Error));
    });
  });

  describe('cleanupOldData', () => {


    it('cleans up old data successfully', async () => {
      const result = await cleanupOldData(mockDB);

      expect(result).toBe(true);
      expect(mockDB.transaction).toHaveBeenCalledWith(STORE_NAME, 'readwrite');
      expect(mockCursor.delete).toHaveBeenCalled();
    });

    it('uses default retention period when not specified', async () => {
      const now = Date.now();
      Date.now = jest.fn(() => now);
      const expectedCutoff = now - (DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      
      await cleanupOldData(mockDB);

      expect(mockIndex.openCursor).toHaveBeenCalledWith({ upper: expectedCutoff });
      Date.now = global.Date.now; // Restore original Date.now
    });

    it('uses custom retention period when specified', async () => {
      const customRetention = 60;
      const now = Date.now();
      Date.now = jest.fn(() => now);
      const expectedCutoff = now - (customRetention * 24 * 60 * 60 * 1000);
      
      await cleanupOldData(mockDB, customRetention);

      expect(mockIndex.openCursor).toHaveBeenCalledWith({ upper: expectedCutoff });
      Date.now = global.Date.now; // Restore original Date.now
    });

    it('handles invalid db parameter', async () => {
      const result = await cleanupOldData(null);
      expect(result).toBe(false);
    });

    it('handles cleanup error', async () => {
      mockCursor.delete.mockRejectedValue(new Error('Cleanup Error'));

      const result = await cleanupOldData(mockDB);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to cleanup old data:', expect.any(Error));
    });
  });
});
