import { useState, useEffect } from 'react';

export const useWallet = () => {
  const [wallet, setWallet] = useState('');
  const [activeWallets, setActiveWallets] = useState([]);
  const [savedWallets, setSavedWallets] = useState([]);

  // Load saved wallets and active wallets on init
  useEffect(() => {
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
  }, []); // Only run once on mount

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wallets', JSON.stringify(savedWallets));
    localStorage.setItem('activeWallets', JSON.stringify(activeWallets));
    if (wallet) {
      localStorage.setItem('lastWallet', wallet);
    } else {
      localStorage.removeItem('lastWallet');
    }
  }, [savedWallets, activeWallets, wallet]);

  // Custom setWallet function
  const handleSetWallet = (newWallet) => {
    setWallet(newWallet);
  };

  // Toggle wallet active status
  const toggleWalletActive = (walletAddress) => {
    let updatedActiveWallets;
    
    if (activeWallets.includes(walletAddress)) {
      // Remove if already active
      updatedActiveWallets = activeWallets.filter(w => w !== walletAddress);
    } else {
      // Add if not active
      updatedActiveWallets = [...activeWallets, walletAddress];
    }
    
    setActiveWallets(updatedActiveWallets);
    
    // Keep the most recently activated wallet as the primary wallet
    if (updatedActiveWallets.length > 0) {
      setWallet(updatedActiveWallets[updatedActiveWallets.length - 1]);
    } else {
      setWallet('');
    }
  };

  const addWallet = (newWallet) => {
    if (newWallet && !savedWallets.includes(newWallet)) {
      setSavedWallets(prev => [...prev, newWallet]);
    }
  };

  const removeWallet = (walletToRemove) => {
    setSavedWallets(prev => prev.filter(w => w !== walletToRemove));
    
    // If removing an active wallet, remove it from active wallets too
    if (activeWallets.includes(walletToRemove)) {
      const updatedActiveWallets = activeWallets.filter(w => w !== walletToRemove);
      setActiveWallets(updatedActiveWallets);
      
      // Update primary wallet if needed
      if (walletToRemove === wallet) {
        if (updatedActiveWallets.length > 0) {
          setWallet(updatedActiveWallets[0]);
        } else {
          setWallet('');
        }
      }
    }
  };

  const clearWallets = () => {
    setSavedWallets([]);
    setActiveWallets([]);
    setWallet('');
  };

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