import { useState, useEffect, useCallback } from 'react';

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

  // Initialize active wallets from localStorage using lazy initialization
  const [activeWallets, setActiveWallets] = useState(() => {
    try {
      // Load active wallets with fallback for backward compatibility
      const lastActiveWallets = localStorage.getItem('activeWallets');
      const parsedActiveWallets = lastActiveWallets
        ? JSON.parse(lastActiveWallets)
        : [];

      if (parsedActiveWallets.length > 0) {
        return parsedActiveWallets;
      } else {
        // For backward compatibility, but still don't set the input field
        const lastWallet = localStorage.getItem('lastWallet');
        if (lastWallet) {
          return [lastWallet];
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading wallet data from localStorage:', error);
      return [];
    }
  });

  // Initialize saved wallets from localStorage using lazy initialization
  const [savedWallets, setSavedWallets] = useState(() => {
    try {
      // Load saved wallets
      const savedWalletsData =
        JSON.parse(localStorage.getItem('wallets')) || [];
      return savedWalletsData;
    } catch (error) {
      console.error('Error loading wallet data from localStorage:', error);
      return [];
    }
  });

  /**
   * Save settings to localStorage whenever they change
   */
  useEffect(() => {
    try {
      localStorage.setItem('wallets', JSON.stringify(savedWallets));
      localStorage.setItem('activeWallets', JSON.stringify(activeWallets));

      if (wallet) {
        localStorage.setItem('lastWallet', wallet);
      } else {
        localStorage.removeItem('lastWallet');
      }
    } catch (error) {
      console.error('Error saving wallet data to localStorage:', error);
    }
  }, [savedWallets, activeWallets, wallet]);

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
    setActiveWallets((prevActiveWallets) => {
      let updatedActiveWallets;

      if (prevActiveWallets.includes(walletAddress)) {
        // Remove if already active
        updatedActiveWallets = prevActiveWallets.filter(
          (w) => w !== walletAddress
        );
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
  const addWallet = useCallback(
    (newWallet) => {
      if (newWallet && !savedWallets.includes(newWallet)) {
        setSavedWallets((prev) => [...prev, newWallet]);
      }
    },
    [savedWallets]
  );

  /**
   * Removes a wallet from saved wallets and active wallets if present
   * Also updates the primary wallet if removed wallet was the primary
   *
   * @param {string} walletToRemove - Wallet address to remove
   */
  const removeWallet = useCallback(
    (walletToRemove) => {
      setSavedWallets((prev) => prev.filter((w) => w !== walletToRemove));

      // If removing an active wallet, remove it from active wallets too
      setActiveWallets((prevActiveWallets) => {
        if (prevActiveWallets.includes(walletToRemove)) {
          const updatedActiveWallets = prevActiveWallets.filter(
            (w) => w !== walletToRemove
          );

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
    },
    [wallet]
  );

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
    clearWallets,
  };
};
