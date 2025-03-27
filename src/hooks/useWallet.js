import { useState, useEffect } from 'react';

export const useWallet = () => {
  const [wallet, setWallet] = useState('');
  const [activeWallets, setActiveWallets] = useState([]);
  const [savedWallets, setSavedWallets] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load saved wallets and active wallets on init
  useEffect(() => {
    setSavedWallets(JSON.parse(localStorage.getItem('wallets')) || []);
    
    // Load last active wallets
    const lastActiveWallets = localStorage.getItem('activeWallets');
    if (lastActiveWallets) {
      setActiveWallets(JSON.parse(lastActiveWallets));
    } else {
      // For backward compatibility
      const lastWallet = localStorage.getItem('lastWallet');
      if (lastWallet) {
        setWallet(lastWallet);
        setActiveWallets([lastWallet]);
      }
    }
  }, []);

  // Custom setWallet function that also saves to localStorage
  const handleSetWallet = (newWallet) => {
    setWallet(newWallet);
    if (newWallet) {
      localStorage.setItem('lastWallet', newWallet);
    }
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
    localStorage.setItem('activeWallets', JSON.stringify(updatedActiveWallets));
    
    // Keep the most recently activated wallet as the primary wallet for backward compatibility
    if (!activeWallets.includes(walletAddress)) {
      setWallet(walletAddress);
      localStorage.setItem('lastWallet', walletAddress);
    } else if (updatedActiveWallets.length > 0) {
      setWallet(updatedActiveWallets[updatedActiveWallets.length - 1]);
      localStorage.setItem('lastWallet', updatedActiveWallets[updatedActiveWallets.length - 1]);
    } else {
      setWallet('');
      localStorage.removeItem('lastWallet');
    }
  };

  const addWallet = (newWallet) => {
    if (newWallet && !savedWallets.includes(newWallet)) {
      const newWallets = [...savedWallets, newWallet];
      setSavedWallets(newWallets);
      localStorage.setItem('wallets', JSON.stringify(newWallets));
    }
  };

  const removeWallet = (walletToRemove) => {
    const newWallets = savedWallets.filter(w => w !== walletToRemove);
    setSavedWallets(newWallets);
    localStorage.setItem('wallets', JSON.stringify(newWallets));
    
    // If removing an active wallet, remove it from active wallets too
    if (activeWallets.includes(walletToRemove)) {
      const updatedActiveWallets = activeWallets.filter(w => w !== walletToRemove);
      setActiveWallets(updatedActiveWallets);
      localStorage.setItem('activeWallets', JSON.stringify(updatedActiveWallets));
    }
    
    // If removing the current wallet, update primary wallet
    if (walletToRemove === wallet) {
      if (activeWallets.length > 0) {
        const newPrimaryWallet = activeWallets.filter(w => w !== walletToRemove)[0] || '';
        setWallet(newPrimaryWallet);
        localStorage.setItem('lastWallet', newPrimaryWallet || '');
      } else {
        setWallet('');
        localStorage.removeItem('lastWallet');
      }
    }
  };

  const clearWallets = () => {
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
    clearWallets
  };
};