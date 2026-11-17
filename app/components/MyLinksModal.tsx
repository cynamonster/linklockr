'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderLock,
  X,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWeb3 } from './Web3Context';
import { supabase } from '../../utils/supabase';

export default function MyLinksModal() {
  const t = useTranslations('CreatePage');
  const {
    isMyLinksOpen,
    setIsMyLinksOpen,
    authenticated,
    wallets,
    selectedAddress,
    user,
    login,
    formatAddress,
  } = useWeb3();

  const [myLinks, setMyLinks] = useState<any[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [copiedLinkSlug, setCopiedLinkSlug] = useState<string | null>(null);

  const activeAddress = selectedAddress || wallets[0]?.address || user?.wallet?.address;

  const fetchMyLinks = useCallback(async () => {
    if (!activeAddress) {
      setMyLinks([]);
      return;
    }
    setIsLoadingLinks(true);
    try {
      const { data, error } = await supabase
        .from('links')
        .select('slug, price_usd, active, created_at')
        .ilike('creator', activeAddress)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching creator links:', error);
      } else {
        setMyLinks(data || []);
      }
    } catch (err) {
      console.error('Error fetching creator links:', err);
    } finally {
      setIsLoadingLinks(false);
    }
  }, [activeAddress]);

  useEffect(() => {
    if (isMyLinksOpen) {
      fetchMyLinks();
    }
  }, [isMyLinksOpen, fetchMyLinks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMyLinksOpen(false);
      }
    };
    if (isMyLinksOpen) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isMyLinksOpen, setIsMyLinksOpen]);

  const handleCopyLink = (slugToCopy: string) => {
    const linkUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/buy/${slugToCopy}`
        : `https://linklockr.xyz/buy/${slugToCopy}`;
    navigator.clipboard.writeText(linkUrl);
    setCopiedLinkSlug(slugToCopy);
    setTimeout(() => setCopiedLinkSlug(null), 2000);
  };

  if (!isMyLinksOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsMyLinksOpen(false)}
      />

      {/* MODAL DIALOG */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <FolderLock size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('tabMyLinks')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your paywalled links on Base
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMyLinksOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ACTIVE WALLET PILL */}
        {authenticated && activeAddress && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{formatAddress(activeAddress)}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-medium">
              Base • USDC
            </span>
          </div>
        )}

        {/* BODY */}
        <div className="min-h-[220px] max-h-[360px] overflow-y-auto pr-1">
          {!authenticated || !activeAddress ? (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <FolderLock className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px]">
                {t('connectToViewLinks')}
              </p>
              <button
                type="button"
                onClick={login}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 dark:from-cyan-600 dark:to-blue-600 text-white font-bold text-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Zap size={14} fill="currentColor" />
                <span>{t('connectWallet')}</span>
              </button>
            </div>
          ) : isLoadingLinks ? (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-4 space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-cyan-500 dark:text-cyan-400" />
              <p className="text-xs text-slate-400 font-mono">Loading your links...</p>
            </div>
          ) : myLinks.length === 0 ? (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-400">
                <FolderLock className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('noLinksFound')}
              </p>
              <button
                type="button"
                onClick={() => setIsMyLinksOpen(false)}
                className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
              >
                + {t('tabLockLink')}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myLinks.map((item) => (
                <div
                  key={item.slug}
                  className="p-3.5 rounded-2xl border bg-slate-50/80 dark:bg-black/40 border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-sm font-bold capitalize text-slate-900 dark:text-white truncate">
                      {item.slug.replace(/-/g, ' ')}
                    </h4>
                    {item.active && (
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check size={10} />
                          {t('verifiedOnBase')}
                        </span>
                      </div>
                    )}
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      ${Number(item.price_usd || 0).toFixed(2)} USDC
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.slug)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title={t('copyLink')}
                    >
                      {copiedLinkSlug === item.slug ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          <span className="text-[11px] font-semibold text-emerald-500">
                            {t('copied')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span className="text-[11px] hidden sm:inline font-medium">
                            {t('copyLink')}
                          </span>
                        </>
                      )}
                    </button>
                    <a
                      href={`/buy/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer text-xs"
                      title={t('viewBuyerPage')}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={fetchMyLinks}
            disabled={isLoadingLinks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={isLoadingLinks ? 'animate-spin' : ''} />
            <span>{t('refreshLinks')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMyLinksOpen(false)}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold transition-colors cursor-pointer"
          >
            + {t('tabLockLink')}
          </button>
        </div>
      </div>
    </div>
  );
}
