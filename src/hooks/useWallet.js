import { useState, useEffect, useCallback } from 'react';

/**
 * Safely access localStorage with SSR compatibility
 *
 * This function prevents "ReferenceError: localStorage is not defined" errors
 * that occur during server-side rendering in Next.js. In SSR environments,
 * the window object (and thus localStorage) is undefined.
 *
 * @param {string} key - The key to get from localStorage
 * @returns {string|null} The value from localStorage or null
 */
const safeGetLocalStorage = (key) => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error accessing localStorage for key "${key}":`, error);
    return null;
  }
};

/**
 * Safely set localStorage with SSR compatibility
 *
 * This function prevents "ReferenceError: localStorage is not defined" errors
 * that occur during server-side rendering in Next.js. In SSR environments,
 * the window object (and thus localStorage) is undefined.
 *
 * @param {string} key - The key to set in localStorage
 * @param {string} value - The value to set
 */
const safeSetLocalStorage = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting localStorage for key "${key}":`, error);
  }
};

/**
 * Safely remove item from localStorage with SSR compatibility
 *
 * This function prevents "ReferenceError: localStorage is not defined" errors
 * that occur during server-side rendering in Next.js. In SSR environments,
 * the window object (and thus localStorage) is undefined.
 *
 * @param {string} key - The key to remove from localStorage
 */
const safeRemoveLocalStorage = (key) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage item for key "${key}":`, error);
  }
};

/**
 * Custom hook for managing wallet addresses
 *
 * This hook is SSR-compatible and handles wallet input state, active wallets,
 * saved wallets, and local storage persistence. It uses safe localStorage
 * access functions that prevent "ReferenceError: localStorage is not defined"
 * errors during server-side rendering in Next.js.
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from localStorage on client side only (after hydration)
  useEffect(() => {
    if (isInitialized) {
      return;
    }

    try {
      // Load active wallets with fallback for backward compatibility
      let parsedActiveWallets = [];
      try {
        const lastActiveWallets = safeGetLocalStorage('activeWallets');
        parsedActiveWallets = lastActiveWallets
          ? JSON.parse(lastActiveWallets)
          : [];
      } catch (error) {
        console.error('Error parsing activeWallets from localStorage:', error);
        parsedActiveWallets = [];
      }

      // Load saved wallets
      let savedWalletsData = [];
      try {
        const walletsData = safeGetLocalStorage('wallets');
        savedWalletsData = walletsData ? JSON.parse(walletsData) : [];
      } catch (error) {
        console.error('Error parsing wallets from localStorage:', error);
        savedWalletsData = [];
      }

      // Handle backward compatibility - check lastWallet if no active wallets
      if (parsedActiveWallets.length === 0) {
        try {
          const lastWallet = safeGetLocalStorage('lastWallet');
          if (lastWallet) {
            parsedActiveWallets = [lastWallet];
          }
        } catch (error) {
          console.error('Error loading lastWallet from localStorage:', error);
        }
      }

      // Set the loaded data in a single batch to avoid cascading renders
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveWallets(
        parsedActiveWallets.length > 0 ? parsedActiveWallets : []
      );

      setSavedWallets(savedWalletsData);

      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading wallet data from localStorage:', error);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  /**
   * Save settings to localStorage whenever they change
   */
  useEffect(() => {
    try {
      safeSetLocalStorage('wallets', JSON.stringify(savedWallets));
      safeSetLocalStorage('activeWallets', JSON.stringify(activeWallets));

      if (wallet) {
        safeSetLocalStorage('lastWallet', wallet);
      } else {
        safeRemoveLocalStorage('lastWallet');
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
