import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';

/**
 * Custom hook for managing wallet addresses
 * Handles wallet input state, active wallets, saved wallets, and local storage persistence
 * 
 * @returns {Object} Wallet management methods and state
 * @returns {string} returns.wallet - Current wallet input value
 * @returns {Function} returns.setWallet - Function to update wallet input value
 * @returns {string[]} returns.activeWallets - Array of currently active wallet addresses
 * @returns {Function} returns.setActiveWallets - Function to set active wallets array
 * @returns {Function} returns.toggleWalletActive - Function to toggle a wallet's active status
 * @returns {string[]} returns.savedWallets - Array of saved wallet addresses
 * @returns {Function} returns.addWallet - Function to add a wallet to saved wallets
 * @returns {Function} returns.removeWallet - Function to remove a wallet from saved wallets
 * @returns {Function} returns.clearWallets - Function to clear all wallets
 */
export const useWallet = () => {
  // State for current wallet input, active wallets, and saved wallets
  const [wallet, setWallet] = useState('');
  const [activeWallets, setActiveWallets] = useState([]);
  const [savedWallets, setSavedWallets] = useState([]);
  const initialLoadComplete = useRef(false); // Flag for initial load

  /**
   * Load saved wallets and active wallets from IndexedDB on initialization
   */
  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const db = await initializeDB();
        if (!db) {
          throw new Error('Failed to initialize IndexedDB');
        }

        // Load saved wallets
        const savedWalletsData = await getData(db, STORE_NAMES.WALLETS, 'wallets');
        const loadedSavedWallets = savedWalletsData?.value || [];
        setSavedWallets(loadedSavedWallets);

        // Load active wallets
        const activeWalletsData = await getData(db, STORE_NAMES.WALLETS, 'activeWallets');
        const loadedActiveWallets = activeWalletsData?.value;
        
        // Load lastWallet for backward compatibility
        const lastWalletData = await getData(db, STORE_NAMES.WALLETS, 'lastWallet');
        const loadedLastWallet = lastWalletData?.value;

        if (Array.isArray(loadedActiveWallets) && loadedActiveWallets.length > 0) {
          setActiveWallets(loadedActiveWallets);
        } else if (loadedLastWallet) {
          // For backward compatibility
          setActiveWallets([loadedLastWallet]);
        } else {
           setActiveWallets([]); // Ensure it's set to empty if nothing loaded
        }
      } catch (error) {
        console.error('Error loading wallet data from IndexedDB:', error); // Keep error log
        // Reset to defaults on error
        setSavedWallets([]);
        setActiveWallets([]);
        setWallet('');
      } finally {
        initialLoadComplete.current = true; // Mark load as complete
      }
    };

    loadWalletData();
  }, []); // Only run once on mount

  /**
   * Save settings to IndexedDB whenever they change, AFTER initial load
   */
  useEffect(() => {
    // Prevent saving until initial load is done
    if (!initialLoadComplete.current) {
      return;
    }

    const saveWalletData = async () => {
      try {
        const db = await initializeDB();
        if (!db) {
          throw new Error('Failed to initialize IndexedDB');
        }

        // Save all wallet data
        await Promise.all([
          saveData(db, STORE_NAMES.WALLETS, { key: 'wallets', value: savedWallets }),
          saveData(db, STORE_NAMES.WALLETS, { key: 'activeWallets', value: activeWallets }),
          wallet
            ? saveData(db, STORE_NAMES.WALLETS, { key: 'lastWallet', value: wallet })
            : saveData(db, STORE_NAMES.WALLETS, { key: 'lastWallet', value: null })
        ]);
      } catch (error) {
        console.error('Error saving wallet data to IndexedDB:', error); // Keep error log
      }
    };

    saveWalletData();
  }, [savedWallets, activeWallets, wallet]); // Dependencies remain the same

  /**
   * Updates the current wallet input value
   * @param {string} newWallet - New wallet address
   */
  const handleSetWallet = useCallback((newWallet) => {
    setWallet(newWallet);
  }, []);

  /**
   * Toggles a wallet's active status
   * If the wallet is active, it will be deactivated
   * If the wallet is not active, it will be activated
   * Also updates the primary wallet
   * 
   * @param {string} walletAddress - Wallet address to toggle
   */
  const toggleWalletActive = useCallback((walletAddress) => {
    setActiveWallets(prevActiveWallets => {
      let updatedActiveWallets;
      
      if (prevActiveWallets.includes(walletAddress)) {
        // Remove if already active
        updatedActiveWallets = prevActiveWallets.filter(w => w !== walletAddress);
      } else {
        // Add if not active
        updatedActiveWallets = [...prevActiveWallets, walletAddress];
      }
      
      // Keep the most recently activated wallet as the primary wallet
      if (updatedActiveWallets.length > 0) {
        setWallet(updatedActiveWallets[updatedActiveWallets.length - 1]);
      } else {
        setWallet('');
      }
      
      return updatedActiveWallets;
    });
  }, []);

  /**
   * Adds a new wallet address to the saved wallets list if it doesn't already exist
   * @param {string} newWallet - Wallet address to add
   */
  const addWallet = useCallback((newWallet) => {
    if (newWallet && !savedWallets.includes(newWallet)) {
      setSavedWallets(prev => [...prev, newWallet]);
    }
  }, [savedWallets]);

  /**
   * Removes a wallet from saved wallets and active wallets if present
   * Also updates the primary wallet if removed wallet was the primary
   * 
   * @param {string} walletToRemove - Wallet address to remove
   */
  const removeWallet = useCallback((walletToRemove) => {
    setSavedWallets(prev => prev.filter(w => w !== walletToRemove));
    
    // If removing an active wallet, remove it from active wallets too
    setActiveWallets(prevActiveWallets => {
      if (prevActiveWallets.includes(walletToRemove)) {
        const updatedActiveWallets = prevActiveWallets.filter(w => w !== walletToRemove);
        
        // Update primary wallet if needed
        if (walletToRemove === wallet) {
          if (updatedActiveWallets.length > 0) {
            setWallet(updatedActiveWallets[0]);
          } else {
            setWallet('');
          }
        }
        
        return updatedActiveWallets;
      }
      
      return prevActiveWallets;
    });
  }, [wallet]);

  /**
   * Clears all saved and active wallets and resets current wallet input
   */
  const clearWallets = useCallback(() => {
    setSavedWallets([]);
    setActiveWallets([]);
    setWallet('');
  }, []);

  return {
    wallet,
    setWallet: handleSetWallet,
    activeWallets,
    setActiveWallets,
    toggleWalletActive,
    savedWallets,
    addWallet,
    removeWallet,
    clearWallets
  };
};