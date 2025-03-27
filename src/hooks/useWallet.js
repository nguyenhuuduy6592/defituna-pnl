import { useState, useEffect } from 'react';

export const useWallet = () => {
  const [wallet, setWallet] = useState('');
  const [activeWallets, setActiveWallets] = useState([]);
  const [savedWallets, setSavedWallets] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load saved wallets and active wallets on init
  useEffect(() => {
    const init = () => {
      const savedWalletsData = JSON.parse(localStorage.getItem('wallets')) || [];
      setSavedWallets(savedWalletsData);
      
      const lastActiveWallets = localStorage.getItem('activeWallets');
      const parsedActiveWallets = lastActiveWallets ? JSON.parse(lastActiveWallets) : [];
      
      if (parsedActiveWallets.length > 0) {
        setActiveWallets(parsedActiveWallets);
        // Set the most recent active wallet as primary
        setWallet(parsedActiveWallets[parsedActiveWallets.length - 1]);
      } else {
        // For backward compatibility
        const lastWallet = localStorage.getItem('lastWallet');
        if (lastWallet) {
          setActiveWallets([lastWallet]);
          setWallet(lastWallet);
        }
      }
      setInitialized(true);
    };

    init();
  }, []); // Only run once on mount

  // Custom setWallet function that also saves to localStorage
  const handleSetWallet = (newWallet) => {
    if (!initialized) return;
    setWallet(newWallet);
    if (newWallet) {
      localStorage.setItem('lastWallet', newWallet);
    }
  };

  // Toggle wallet active status
  const toggleWalletActive = (walletAddress) => {
    if (!initialized) return;
    let updatedActiveWallets;
    
    if (activeWallets.includes(walletAddress)) {
      // Remove if already active
      updatedActiveWallets = activeWallets.filter(w => w !== walletAddress);
    } else {
      // Add if not active
      updatedActiveWallets = [...activeWallets, walletAddress];
    }
    
    setActiveWallets(updatedActiveWallets);
    localStorage.setItem('activeWallets', JSON.stringify(updatedActiveWallets));
    
    // Keep the most recently activated wallet as the primary wallet
    if (updatedActiveWallets.length > 0) {
      setWallet(updatedActiveWallets[updatedActiveWallets.length - 1]);
      localStorage.setItem('lastWallet', updatedActiveWallets[updatedActiveWallets.length - 1]);
    } else {
      setWallet('');
      localStorage.removeItem('lastWallet');
    }
  };

  const addWallet = (newWallet) => {
    if (!initialized) return;
    if (newWallet && !savedWallets.includes(newWallet)) {
      const newWallets = [...savedWallets, newWallet];
      setSavedWallets(newWallets);
      localStorage.setItem('wallets', JSON.stringify(newWallets));
    }
  };

  const removeWallet = (walletToRemove) => {
    if (!initialized) return;
    const newWallets = savedWallets.filter(w => w !== walletToRemove);
    setSavedWallets(newWallets);
    localStorage.setItem('wallets', JSON.stringify(newWallets));
    
    // If removing an active wallet, remove it from active wallets too
    if (activeWallets.includes(walletToRemove)) {
      const updatedActiveWallets = activeWallets.filter(w => w !== walletToRemove);
      setActiveWallets(updatedActiveWallets);
      localStorage.setItem('activeWallets', JSON.stringify(updatedActiveWallets));
      
      // Update primary wallet if needed
      if (walletToRemove === wallet) {
        if (updatedActiveWallets.length > 0) {
          const newPrimaryWallet = updatedActiveWallets[0];
          setWallet(newPrimaryWallet);
          localStorage.setItem('lastWallet', newPrimaryWallet);
        } else {
          setWallet('');
          localStorage.removeItem('lastWallet');
        }
      }
    }
  };

  const clearWallets = () => {
    if (!initialized) return;
    setSavedWallets([]);
    setActiveWallets([]);
    setWallet('');
    localStorage.removeItem('wallets');
    localStorage.removeItem('activeWallets');
    localStorage.removeItem('lastWallet');
  };

  return {
    wallet,
    setWallet: handleSetWallet,
    activeWallets,
    toggleWalletActive,
    savedWallets,
    showDropdown,
    setShowDropdown,
    addWallet,
    removeWallet,
    clearWallets,
    initialized
  };
};