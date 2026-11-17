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
  isMyLinksOpen: boolean;
  setIsMyLinksOpen: (open: boolean) => void;
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
  const [isMyLinksOpen, setIsMyLinksOpen] = useState(false);
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

  // Auto-preload Privy:
  // 1. If an active session exists, load immediately to restore wallet.
  // 2. Otherwise, preload in idle time so it is 100% warmed up when the user clicks "Connect Wallet".
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
        return;
      }
    } catch {}

    // Idle-preload so first click opens immediately without gesture-timeout or popup blocking
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const id = (window as any).requestIdleCallback(
          () => {
            setShouldLoadPrivy(true);
          },
          { timeout: 2000 }
        );
        return () => (window as any).cancelIdleCallback?.(id);
      } else {
        const timer = setTimeout(() => {
          setShouldLoadPrivy(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Safety net: ensure isConnecting never gets stuck permanently
  useEffect(() => {
    if (isConnecting) {
      const timer = setTimeout(() => {
        setIsConnecting(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isConnecting]);

  const handleSync = useCallback((data: PrivySyncData) => {
    setPrivyData(data);
    if (data.isReady) {
      setIsConnecting(false);
    }
  }, []);

  const wallets = privyData?.wallets || [];
  useEffect(() => {
    if (wallets.length > 0 && !selectedAddress) {
      setSelectedAddress(wallets[0].address);
    } else if (!selectedAddress && privyData?.user?.wallet?.address) {
      setSelectedAddress(privyData.user.wallet.address);
    }
  }, [wallets, selectedAddress, privyData?.user?.wallet?.address]);

  const activeWallet =
    wallets.find((w) => w.address === selectedAddress) ||
    wallets[0] ||
    (privyData?.user?.wallet
      ? {
          address: privyData.user.wallet.address,
          walletClientType: (privyData.user.wallet as any).walletClientType || 'privy',
          getEthereumProvider: async () => {
            const eth = (window as any).ethereum;
            if (eth) return eth;
            throw new Error('No wallet provider available');
          },
        }
      : null);

  const preloadPrivy = useCallback(() => {
    setShouldLoadPrivy(true);
  }, []);

  const login = useCallback(() => {
    setShouldLoadPrivy(true);
    if (privyData?.isReady) {
      if (privyData.authenticated) {
        // If already authenticated in Privy, open wallet connect / create modal
        if (privyData.connectWallet) {
          privyData.connectWallet();
        } else if (privyData.createWallet) {
          privyData.createWallet();
        }
      } else if (privyData.login) {
        privyData.login();
      }
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
    isMyLinksOpen,
    setIsMyLinksOpen,
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
