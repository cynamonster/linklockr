'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import type { PrivySyncData } from './PrivyBridge';

const DynamicPrivyBridge = dynamic(() => import('./PrivyBridge'), {
  ssr: false,
});

export interface Web3ContextType {
  authenticated: boolean;
  user: any;
  wallets: any[];
  selectedAddress: string;
  setSelectedAddress: (addr: string) => void;
  activeWallet: any;
  login: () => void;
  logout: () => void;
  preloadPrivy: () => void;
  isConnecting: boolean;
  isWalletDrawerOpen: boolean;
  setIsWalletDrawerOpen: (open: boolean) => void;
  isPrivyReady: boolean;
  isDark: boolean;
  formatAddress: (addr: string) => string;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return ctx;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [shouldLoadPrivy, setShouldLoadPrivy] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [privyData, setPrivyData] = useState<PrivySyncData | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(false);
  const [triggerLogin, setTriggerLogin] = useState(false);

  // Sync theme with system settings
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (matches: boolean) => {
      setIsDark(matches);
      if (matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => updateTheme(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ONLY load Privy on startup if the user has an active session from a previous visit.
  // Otherwise, Privy stays completely unmounted until the user taps "Connect Wallet".
  useEffect(() => {
    try {
      const hasPrivySession =
        !!localStorage.getItem('privy:token') ||
        !!localStorage.getItem('privy:refresh_token') ||
        !!localStorage.getItem('privy:id_token') ||
        document.cookie.includes('privy-token') ||
        document.cookie.includes('privy-session');

      if (hasPrivySession) {
        setShouldLoadPrivy(true);
      }
    } catch {}
  }, []);

  const handleSync = useCallback((data: PrivySyncData) => {
    setPrivyData(data);
    if (data.isReady && data.authenticated) {
      setIsConnecting(false);
    }
  }, []);

  const wallets = privyData?.wallets || [];
  useEffect(() => {
    if (wallets.length > 0 && !selectedAddress) {
      setSelectedAddress(wallets[0].address);
    }
  }, [wallets, selectedAddress]);

  const activeWallet = wallets.find((w) => w.address === selectedAddress) || wallets[0] || null;

  const preloadPrivy = useCallback(() => {
    setShouldLoadPrivy(true);
  }, []);

  const login = useCallback(() => {
    setShouldLoadPrivy(true);
    if (privyData?.isReady && privyData?.login) {
      privyData.login();
    } else {
      setIsConnecting(true);
      setTriggerLogin(true);
    }
  }, [privyData]);

  const logout = useCallback(() => {
    if (privyData?.logout) {
      privyData.logout();
    }
  }, [privyData]);

  const onLoginTriggered = useCallback(() => {
    setTriggerLogin(false);
    setIsConnecting(false);
  }, []);

  const formatAddress = useCallback((addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  const value: Web3ContextType = {
    authenticated: !!privyData?.authenticated,
    user: privyData?.user || null,
    wallets,
    selectedAddress,
    setSelectedAddress,
    activeWallet,
    login,
    logout,
    preloadPrivy,
    isConnecting,
    isWalletDrawerOpen,
    setIsWalletDrawerOpen,
    isPrivyReady: !!privyData?.isReady,
    isDark,
    formatAddress,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
      {shouldLoadPrivy && (
        <DynamicPrivyBridge
          isDark={isDark}
          onSync={handleSync}
          triggerLogin={triggerLogin}
          onLoginTriggered={onLoginTriggered}
        />
      )}
    </Web3Context.Provider>
  );
}
