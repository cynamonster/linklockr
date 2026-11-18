'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  FolderLock,
  X,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Zap,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWeb3 } from './Web3Context';
import { supabase } from '../../utils/supabase';
import { createSiweMessage } from '../../utils/lit';
import { ensureBaseChain } from '../../utils/chainGuard';

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xa675E3Cc45d27e78B72014f0e659638c52B93c1A';

export default function MyLinksModal() {
  const t = useTranslations('CreatePage');
  const {
    isMyLinksOpen,
    setIsMyLinksOpen,
    authenticated,
    wallets,
    activeWallet,
    selectedAddress,
    user,
    login,
    formatAddress,
  } = useWeb3();

  // Tab State
  const [modalTab, setModalTab] = useState<'created' | 'unlocked'>('created');

  // Tab 1: Created Links State
  const [myLinks, setMyLinks] = useState<any[]>([]);
  const [isLoadingCreated, setIsLoadingCreated] = useState(false);

  // Tab 2: Unlocked Links (Library / Purchases) State
  const [unlockedLinks, setUnlockedLinks] = useState<any[]>([]);
  const [isLoadingUnlocked, setIsLoadingUnlocked] = useState(false);
  const [decryptingSlugs, setDecryptingSlugs] = useState<Record<string, boolean>>({});
  const [decryptedSecrets, setDecryptedSecrets] = useState<Record<string, string>>({});

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeAddress = selectedAddress || wallets[0]?.address || user?.wallet?.address;

  // 1. Fetch Created Links
  const fetchCreatedLinks = useCallback(async () => {
    if (!activeAddress) {
      setMyLinks([]);
      return;
    }
    setIsLoadingCreated(true);
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
      setIsLoadingCreated(false);
    }
  }, [activeAddress]);

  // 2. Fetch Unlocked Links (Purchases)
  const fetchUnlockedLinks = useCallback(async () => {
    if (!activeAddress) {
      setUnlockedLinks([]);
      return;
    }
    setIsLoadingUnlocked(true);
    try {
      const { data: allLinks, error: linksErr } = await supabase
        .from('links')
        .select('slug, creator, price_usd, token_id, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (linksErr || !allLinks) {
        console.error('Error fetching links for library:', linksErr);
        return;
      }

      // Check local purchases cache
      let localPurchases: string[] = [];
      try {
        localPurchases = JSON.parse(
          localStorage.getItem(`linklockr_purchases_${activeAddress.toLowerCase()}`) || '[]'
        );
      } catch {}

      // Candidate links not created by the active address
      const candidateLinks = allLinks.filter(
        (l) => l.creator?.toLowerCase() !== activeAddress.toLowerCase()
      );

      if (candidateLinks.length === 0) {
        setUnlockedLinks([]);
        return;
      }

      // Query on-chain batch balances
      try {
        const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          [
            'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
            'function balanceOf(address account, uint256 id) view returns (uint256)',
          ],
          provider
        );

        const accounts = candidateLinks.map(() => activeAddress);
        const ids = candidateLinks.map((l) => {
          if (l.token_id) return l.token_id;
          const slugBytes = ethers.toUtf8Bytes(l.slug);
          const slugHash = ethers.keccak256(ethers.solidityPacked(['bytes'], [slugBytes]));
          return BigInt(slugHash).toString();
        });

        const balances: bigint[] = await contract.balanceOfBatch(accounts, ids);
        const verifiedUnlocked: any[] = [];
        const updatedLocal: string[] = [...localPurchases];

        candidateLinks.forEach((link, idx) => {
          if (balances[idx] > BigInt(0) || localPurchases.includes(link.slug)) {
            verifiedUnlocked.push(link);
            if (!updatedLocal.includes(link.slug)) {
              updatedLocal.push(link.slug);
            }
          }
        });

        try {
          localStorage.setItem(
            `linklockr_purchases_${activeAddress.toLowerCase()}`,
            JSON.stringify(updatedLocal)
          );
        } catch {}

        setUnlockedLinks(verifiedUnlocked);
      } catch (rpcErr) {
        console.warn('balanceOfBatch notice, using local cache fallback:', rpcErr);
        const cached = candidateLinks.filter((l) => localPurchases.includes(l.slug));
        setUnlockedLinks(cached);
      }
    } catch (err) {
      console.error('Error fetching unlocked links:', err);
    } finally {
      setIsLoadingUnlocked(false);
    }
  }, [activeAddress]);

  // In-place Decryption Flow for Unlocked Links
  const handleDecryptInPlace = async (slug: string) => {
    if (!activeWallet) return login();
    setDecryptingSlugs((prev) => ({ ...prev, [slug]: true }));

    try {
      await ensureBaseChain(activeWallet);
      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const rawAddress = await signer.getAddress();
      const address = ethers.getAddress(rawAddress);

      // Generate EIP-4361 SIWE Message
      const message = createSiweMessage({
        address,
        domain: window.location.host,
        uri: window.location.origin,
        chainId: 8453,
      });

      // Request Signature from Wallet
      const signature = await signer.signMessage(message);

      const res = await fetch('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, message, signature }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to decrypt content');

      setDecryptedSecrets((prev) => ({ ...prev, [slug]: data.url }));
    } catch (err: any) {
      console.error('In-place decrypt error:', err);
      alert(err.message || 'Decryption failed');
    } finally {
      setDecryptingSlugs((prev) => ({ ...prev, [slug]: false }));
    }
  };

  // Reset caches on address switch
  useEffect(() => {
    setMyLinks([]);
    setUnlockedLinks([]);
    setDecryptedSecrets({});
  }, [activeAddress]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isMyLinksOpen) {
      fetchCreatedLinks();
      fetchUnlockedLinks();
    }
  }, [isMyLinksOpen, fetchCreatedLinks, fetchUnlockedLinks]);

  // Handle Escape key
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

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyShareLink = (slugToCopy: string) => {
    const linkUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/buy/${slugToCopy}`
        : `https://linklockr.xyz/buy/${slugToCopy}`;
    handleCopyText(linkUrl, `share_${slugToCopy}`);
  };

  if (!isMyLinksOpen) return null;

  const isLoading = modalTab === 'created' ? isLoadingCreated : isLoadingUnlocked;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsMyLinksOpen(false)}
      />

      {/* MODAL DIALOG */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative z-10 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
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
                Your created &amp; unlocked content on Base
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

        {/* 2-TAB SEGMENTED CONTROLLER */}
        <div className="flex items-center p-1 rounded-2xl border bg-slate-100 dark:bg-black/50 border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setModalTab('created')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modalTab === 'created'
                ? 'bg-white dark:bg-cyan-500 text-slate-900 dark:text-black shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderLock size={13} />
            <span>{t('tabCreatedLinks')}</span>
            {myLinks.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  modalTab === 'created'
                    ? 'bg-slate-900/10 dark:bg-black/20 text-slate-900 dark:text-black'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {myLinks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setModalTab('unlocked')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modalTab === 'unlocked'
                ? 'bg-white dark:bg-cyan-500 text-slate-900 dark:text-black shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>{t('tabUnlockedLinks')}</span>
            {unlockedLinks.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  modalTab === 'unlocked'
                    ? 'bg-slate-900/10 dark:bg-black/20 text-slate-900 dark:text-black'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {unlockedLinks.length}
              </span>
            )}
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
        <div className="min-h-[240px] max-h-[380px] overflow-y-auto pr-1">
          {!authenticated || !activeAddress ? (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-4 space-y-3">
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
          ) : isLoading ? (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-4 space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-cyan-500 dark:text-cyan-400" />
              <p className="text-xs text-slate-400 font-mono">
                {modalTab === 'created' ? 'Loading created links...' : 'Loading unlocked links...'}
              </p>
            </div>
          ) : modalTab === 'created' ? (
            /* TAB 1: CREATED LINKS */
            myLinks.length === 0 ? (
              <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-4 space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-400">
                  <FolderLock className="w-8 h-8" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('noLinksFound')}</p>
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
                        onClick={() => handleCopyShareLink(item.slug)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                        title={t('copyLink')}
                      >
                        {copiedKey === `share_${item.slug}` ? (
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
            )
          ) : (
            /* TAB 2: UNLOCKED LINKS (LIBRARY / PURCHASES) */
            unlockedLinks.length === 0 ? (
              <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-4 space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-400">
                  <Sparkles className="w-8 h-8 text-cyan-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('noPurchasesFound')}
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
              <div className="space-y-3">
                {unlockedLinks.map((item) => (
                  <div
                    key={item.slug}
                    className="p-3.5 rounded-2xl border bg-slate-50/80 dark:bg-black/40 border-slate-200/80 dark:border-slate-800/80 space-y-2.5 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold capitalize text-slate-900 dark:text-white truncate">
                            {item.slug.replace(/-/g, ' ')}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Check size={10} />
                            {t('unlockedBadge')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            {t('paidAmount')}: ${Number(item.price_usd || 0).toFixed(2)} USDC
                          </span>
                          {item.creator && (
                            <span className="flex items-center gap-1 text-[11px] font-mono">
                              <span className="opacity-70">{t('creatorAddress')}:</span>
                              <span>{formatAddress(item.creator)}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(item.creator, `creator_${item.slug}`)
                                }
                                className="p-0.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                title="Copy creator address"
                              >
                                {copiedKey === `creator_${item.slug}` ? (
                                  <Check size={11} className="text-emerald-500" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDecryptInPlace(item.slug)}
                          disabled={decryptingSlugs[item.slug]}
                          className="px-2.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {decryptingSlugs[item.slug] ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-cyan-400" />
                              <span className="text-[11px]">{t('decryptingSecret')}</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={13} />
                              <span className="text-[11px]">{t('viewOrDecrypt')}</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`/buy/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer text-xs"
                          title={t('viewBuyerPage')}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>

                    {/* IN-PLACE DECRYPTED REVEAL CONTAINER */}
                    {decryptedSecrets[item.slug] && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-left animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                          <span>{t('decryptedSecret')}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-white/5 overflow-hidden">
                          <span className="text-xs text-emerald-300 font-mono truncate flex-1 select-all">
                            {decryptedSecrets[item.slug]}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(decryptedSecrets[item.slug], `secret_${item.slug}`)
                            }
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                          >
                            {copiedKey === `secret_${item.slug}` ? (
                              <Check size={13} className="text-emerald-400" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                        <a
                          href={
                            decryptedSecrets[item.slug].startsWith('http')
                              ? decryptedSecrets[item.slug]
                              : `https://${decryptedSecrets[item.slug]}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>{t('openDecrypted')}</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* FOOTER */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              if (modalTab === 'created') {
                fetchCreatedLinks();
              } else {
                fetchUnlockedLinks();
              }
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
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
