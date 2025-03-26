import { useState, useEffect } from 'react';

export const useWallet = () => {
  const [wallet, setWallet] = useState('');
  const [savedWallets, setSavedWallets] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load saved wallets and last used wallet on init
  useEffect(() => {
    setSavedWallets(JSON.parse(localStorage.getItem('wallets')) || []);
    const lastWallet = localStorage.getItem('lastWallet');
    if (lastWallet) {
      setWallet(lastWallet);
    }
  }, []);

  // Custom setWallet function that also saves to localStorage
  const handleSetWallet = (newWallet) => {
    setWallet(newWallet);
    if (newWallet) {
      localStorage.setItem('lastWallet', newWallet);
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
    
    // If removing the current wallet, clear it
    if (walletToRemove === wallet) {
      setWallet('');
      localStorage.removeItem('lastWallet');
    }
  };

  const clearWallets = () => {
    setSavedWallets([]);
    localStorage.removeItem('wallets');
    setWallet('');
    localStorage.removeItem('lastWallet');
  };

  return {
    wallet,
    setWallet: handleSetWallet,
    savedWallets,
    showDropdown,
    setShowDropdown,
    addWallet,
    removeWallet,
    clearWallets
  };
};