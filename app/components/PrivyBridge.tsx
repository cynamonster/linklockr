'use client';

import React, { useEffect, useRef } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

export interface PrivySyncData {
  authenticated: boolean;
  user: any;
  wallets: any[];
  login: () => void;
  logout: () => void;
  isReady: boolean;
}

interface PrivyBridgeProps {
  isDark: boolean;
  onSync: (data: PrivySyncData) => void;
  triggerLogin?: boolean;
  onLoginTriggered?: () => void;
}

function PrivyBridgeInner({
  onSync,
  triggerLogin,
  onLoginTriggered,
}: {
  onSync: PrivyBridgeProps['onSync'];
  triggerLogin?: boolean;
  onLoginTriggered?: () => void;
}) {
  const { authenticated, user, login, logout, ready } = usePrivy();
  const { wallets } = useWallets();
  const loginRef = useRef(login);
  loginRef.current = login;

  useEffect(() => {
    onSync({
      authenticated,
      user,
      wallets,
      login,
      logout,
      isReady: ready,
    });
  }, [authenticated, user, wallets, login, logout, ready, onSync]);

  useEffect(() => {
    if (triggerLogin && ready) {
      loginRef.current();
      onLoginTriggered?.();
    }
  }, [triggerLogin, ready, onLoginTriggered]);

  return null;
}

export default function PrivyBridge({
  isDark,
  onSync,
  triggerLogin,
  onLoginTriggered,
}: PrivyBridgeProps) {
  if (!PRIVY_APP_ID) return null;

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: isDark ? 'dark' : 'light',
          accentColor: isDark ? '#22d3ee' : '#3b82f6',
        },
        fundingMethodConfig: {
          moonpay: {
            useSandbox: false,
          },
        },
        defaultChain: {
          id: 8453,
          name: 'Base',
          network: 'base',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
        },
        supportedChains: [
          {
            id: 8453,
            name: 'Base',
            network: 'base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
          },
        ],
      }}
    >
      <PrivyBridgeInner
        onSync={onSync}
        triggerLogin={triggerLogin}
        onLoginTriggered={onLoginTriggered}
      />
    </PrivyProvider>
  );
}
