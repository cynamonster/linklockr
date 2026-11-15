'use client';

import React from 'react';
import { ChevronDown, Loader2, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWeb3 } from './Web3Context';

export default function HeaderWalletButton() {
  const t = useTranslations('CreatePage');
  const {
    authenticated,
    activeWallet,
    selectedAddress,
    formatAddress,
    setIsWalletDrawerOpen,
    login,
    preloadPrivy,
    isConnecting,
  } = useWeb3();

  return (
    <div className="flex items-center shrink-0">
      {authenticated && activeWallet ? (
        <button
          onClick={() => setIsWalletDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer bg-white dark:bg-slate-900/80 border-slate-200 dark:border-cyan-500/40 text-slate-800 dark:text-cyan-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.15)]"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="truncate">{formatAddress(selectedAddress || activeWallet.address)}</span>
          <ChevronDown size={14} className="opacity-60 shrink-0" />
        </button>
      ) : (
        <button
          onClick={login}
          onMouseEnter={preloadPrivy}
          onTouchStart={preloadPrivy}
          disabled={isConnecting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer bg-gradient-to-r from-sky-500 to-blue-600 dark:from-cyan-600 dark:to-blue-600 text-white hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-[1.02] disabled:opacity-75"
        >
          {isConnecting ? (
            <Loader2 size={14} className="animate-spin shrink-0" />
          ) : (
            <Zap size={14} fill="currentColor" className="shrink-0" />
          )}
          <span>{isConnecting ? 'Connecting...' : t('connectWallet')}</span>
        </button>
      )}
    </div>
  );
}
