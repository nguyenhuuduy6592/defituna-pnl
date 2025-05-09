import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './TokenSelect.module.scss';

interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  icon?: string;
}

interface TokenSelectProps {
  tokens: TokenMetadata[];
  value: string;
  onChange: (value: string) => void;
}

export default function TokenSelect({ tokens, value, onChange }: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedToken = tokens.find(t => t.mint === value);

  // Filter tokens based on search term
  const filteredTokens = tokens.filter(token => {
    const search = searchTerm.toLowerCase();
    // Ensure properties exist before calling toLowerCase to prevent runtime errors
    const symbolMatch = token.symbol && token.symbol.toLowerCase().includes(search);
    const nameMatch = token.name && token.name.toLowerCase().includes(search);
    const mintMatch = token.mint && token.mint.toLowerCase().includes(search);

    return symbolMatch || nameMatch || mintMatch;
  });

  return (
    <div className={styles.tokenSelect} ref={dropdownRef}>
      <div 
        className={`${styles.tokenSelectButton} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedToken ? (
          <>
            <div className={styles.selectedTokenInfo}>
              {selectedToken.icon ? (
                <Image
                  src={selectedToken.icon}
                  alt={selectedToken.symbol}
                  width={20}
                  height={20}
                  className={styles.tokenIcon}
                />
              ) : (
                <div className={styles.tokenIconPlaceholder} />
              )}
              <span className={styles.tokenSymbol}>{selectedToken.symbol}</span>
            </div>
          </>
        ) : (
          <span>All Tokens</span>
        )}
        <svg
          className={`${styles.arrow} ${isOpen ? styles.up : ''}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchContainer}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tokens..."
              className={styles.searchInput}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                className={styles.clearSearch}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
              >
                ×
              </button>
            )}
          </div>
          <div 
            className={styles.option}
            onClick={() => {
              onChange('');
              setIsOpen(false);
              setSearchTerm('');
            }}
          >
            <span className={styles.allTokens}>All Tokens</span>
          </div>
          {filteredTokens.map(token => (
            <div
              key={token.mint}
              className={`${styles.option} ${token.mint === value ? styles.selected : ''}`}
              onClick={() => {
                onChange(token.mint);
                setIsOpen(false);
                setSearchTerm('');
              }}
            >
              <div className={styles.tokenInfo}>
                {token.icon ? (
                  <Image
                    src={token.icon}
                    alt={token.symbol}
                    width={20}
                    height={20}
                    className={styles.tokenIcon}
                  />
                ) : (
                  <div className={styles.tokenIconPlaceholder} />
                )}
                <div className={styles.tokenDetails}>
                  <span className={styles.tokenSymbol}>{token.symbol}</span>
                  <span className={styles.tokenName}>{token.name}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredTokens.length === 0 && (
            <div className={styles.noResults}>
              No tokens found
            </div>
          )}
        </div>
      )}
    </div>
  );
} 