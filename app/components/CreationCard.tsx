'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Loader2,
  Zap,
  RefreshCw,
  Copy,
  CheckCircle2,
  Shield,
  Square,
  SquareCheckBig,
  ExternalLink,
  Share2,
  Sparkles,
  Check,
  FolderLock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWeb3 } from './Web3Context';
import { supabase } from '../../utils/supabase';
import { ensureBaseChain } from '../../utils/chainGuard';
import { generateSlugAction } from '../actions/slug';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const CONTRACT_ABI = [
  'function createLink(string _slug, uint256 _price, string _ipfsHash) external',
];

interface CreationCardProps {
  initialSlug: string;
  percentFeeBps: number;
}

export default function CreationCard({
  initialSlug,
  percentFeeBps,
}: CreationCardProps) {
  const t = useTranslations('CreatePage');
  const {
    authenticated,
    wallets,
    selectedAddress,
    login,
    preloadPrivy,
    user,
    isDark,
  } = useWeb3();

  // Create Form State
  const [urlToLock, setUrlToLock] = useState('');
  const [price, setPrice] = useState('');
  const [slug, setSlug] = useState(initialSlug);
  const [isTermsChecked, setIsTermsChecked] = useState(false);

  // In-Place Card Tab & Preview States
  const [cardTab, setCardTab] = useState<'create' | 'links' | 'preview'>('create');
  const [previewMode, setPreviewMode] = useState<'locked' | 'unlocked'>('locked');

  // Creator's Links State
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
    if (cardTab === 'links') {
      fetchMyLinks();
    }
  }, [cardTab, fetchMyLinks]);

  const handleCopyLink = (slugToCopy: string) => {
    const linkUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/buy/${slugToCopy}`
        : `https://linklockr.xyz/buy/${slugToCopy}`;
    navigator.clipboard.writeText(linkUrl);
    setCopiedLinkSlug(slugToCopy);
    setTimeout(() => setCopiedLinkSlug(null), 2000);
  };

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingSlug, setIsRefreshingSlug] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Draft persistence across session/Privy popup
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('linklockr_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.urlToLock && !urlToLock) setUrlToLock(parsed.urlToLock);
        if (parsed.price && !price) setPrice(parsed.price);
        if (parsed.slug && !slug) setSlug(parsed.slug);
        if (parsed.isTermsChecked) setIsTermsChecked(parsed.isTermsChecked);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        'linklockr_draft',
        JSON.stringify({ urlToLock, price, slug, isTermsChecked })
      );
    } catch {}
  }, [urlToLock, price, slug, isTermsChecked]);

  const handleGenerateSlug = async () => {
    setIsRefreshingSlug(true);
    try {
      const newSlug = await generateSlugAction();
      if (newSlug) setSlug(newSlug);
    } catch (e) {
      console.error('Failed to generate slug via server action:', e);
      try {
        const res = await fetch('/api/slug');
        const data = await res.json();
        if (data.slug) setSlug(data.slug);
      } catch {}
    } finally {
      setIsRefreshingSlug(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreateLock = async () => {
    if (!authenticated) {
      if (!urlToLock || !price || !slug) return alert(t('missingFields'));
      if (!isTermsChecked) return alert('Please agree to the terms to proceed.');
      return login();
    }

    const wallet = wallets.find((w) => w.address === selectedAddress) || wallets[0];
    if (!wallet) return alert(t('pleaseConnectWallet'));
    if (!urlToLock || !price || !slug) return alert(t('missingFields'));
    if (!isTermsChecked) return alert('Please agree to the terms to proceed.');

    setIsLoading(true);
    try {
      const { ethers } = await import('ethers');
      // 1. SETUP & CHAIN GUARD
      setStatusMsg(t('status.connecting'));
      await ensureBaseChain(wallet);
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      // 2. CHECK AVAILABILITY & DB CONNECTION
      setStatusMsg(t('status.checking'));
      const { data: existing, error: checkError } = await supabase
        .from('links')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();

      if (checkError) {
        console.error('Database connection check failed:', checkError);
        throw new Error(
          `Database connection failed: ${checkError.message || 'Failed to reach database'}. Check your Supabase configuration before minting.`
        );
      }
      if (existing) throw new Error(t('slugTaken'));

      // 3. CALCULATE ID & ENCRYPT VIA LIT v3 (CHIPOTLE)
      setStatusMsg(t('status.encrypting'));
      const slugBytes = ethers.toUtf8Bytes(slug);
      const slugHash = ethers.keccak256(ethers.solidityPacked(['bytes'], [slugBytes]));
      const tokenId = BigInt(slugHash).toString();

      // Secure server-side call using funded Lit v3 TEE hosting
      const encryptRes = await fetch('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToLock }),
      });

      if (!encryptRes.ok) {
        const errData = await encryptRes.json();
        throw new Error(errData.error || 'Failed to encrypt content with Lit v3');
      }

      const { ciphertext } = await encryptRes.json();

      // 4. PREPARE URI REFERENCE FOR SMART CONTRACT
      const linkReferenceUri = `lit://chipotle/${slug}`;

      // Save backup payload in localStorage
      const recoveryKey = `linklockr_recovery_${slug}`;
      const linkPayload: Record<string, any> = {
        slug,
        id_hash: slugHash,
        token_id: tokenId,
        ciphertext,
        creator:
          user?.wallet?.address || selectedAddress || (await signer.getAddress()),
        price_usd: 0,
        price_usdc: 0,
        price_eth: '0',
        price_wei: '0',
        ipfs_hash: linkReferenceUri,
        active: true,
      };

      // 5. MINT ON CHAIN
      setStatusMsg(t('status.confirming'));
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const priceUsd = parseFloat(price);
      const priceUnits = ethers.parseUnits(priceUsd.toFixed(6), 6);

      linkPayload.price_usd = priceUsd;
      linkPayload.price_usdc = priceUsd;
      linkPayload.price_eth = priceUsd.toFixed(2);
      linkPayload.price_wei = priceUnits.toString();

      try {
        localStorage.setItem(recoveryKey, JSON.stringify(linkPayload));
      } catch {}

      const tx = await contract.createLink(slug, priceUnits, linkReferenceUri);
      setStatusMsg(t('status.confirming'));
      await tx.wait();

      // 6. RECORD TO SUPABASE (Upsert for safety)
      setStatusMsg(t('status.saving'));
      const { error: insertError } = await supabase.from('links').upsert(linkPayload);

      if (insertError) {
        console.error('Supabase write error:', insertError);
        throw new Error(
          `Smart contract succeeded, but failed to save to database: ${insertError.message}. Backed up locally under: ${recoveryKey}`
        );
      }

      // Cleanup local recovery
      try {
        localStorage.removeItem(recoveryKey);
      } catch {}

      // Trigger Discord mod mint feed notification (non-blocking)
      fetch('/api/notify-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          creator: linkPayload.creator,
          priceUsd: priceUsd,
          txHash: tx.hash,
        }),
      }).catch((err) => console.warn('Discord mint notification warning:', err));

      setCreatedSlug(slug);
      setStatusMsg(t('status.success'));
      setUrlToLock('');
      setPrice('');
      handleGenerateSlug();
    } catch (e: any) {
      console.error(e);
      const msg = e.reason || e.message || 'Unknown error';
      alert('Error: ' + msg);
    }
    setIsLoading(false);
    setStatusMsg('');
  };

  // --- CELEBRATION SCREEN VIEW ---
  if (createdSlug) {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/buy/${createdSlug}`
        : `https://linklockr.xyz/buy/${createdSlug}`;
    const warpcastShareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
      'Unlock my paywalled content on Base L2 via @linklockr:'
    )}&embeds[]=${encodeURIComponent(shareUrl)}`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      'Unlock my paywalled content on Base L2 via @LinkLockr:'
    )}&url=${encodeURIComponent(shareUrl)}`;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent('Unlock my paywalled content on Base L2 via LinkLockr:')}`;

    return (
      <div className="w-full p-6 sm:p-8 rounded-[2.5rem] border text-center space-y-6 backdrop-blur-2xl shadow-2xl transition-all bg-white/90 dark:bg-slate-900/80 border-white dark:border-slate-700/80 shadow-blue-900/10 dark:shadow-cyan-950/20">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg bg-green-100 dark:bg-cyan-500/10 text-green-600 dark:text-cyan-400 border border-transparent dark:border-cyan-500/30 shadow-green-500/20 dark:shadow-[0_0_20px_rgba(34,211,238,0.25)]">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('linkCreated')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('linkCreated_desc')}
          </p>
        </div>

        {/* LINK COPY BAR */}
        <div className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-slate-800">
          <code className="text-sm font-mono truncate text-left text-blue-600 dark:text-cyan-400">
            {shareUrl}
          </code>
          <button
            onClick={() => handleCopy(shareUrl)}
            className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold ${
              isCopied
                ? 'bg-cyan-500 text-black font-bold'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
            }`}
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
            <span>{isCopied ? t('copied') : t('copyShareLink')}</span>
          </button>
        </div>

        {/* 1-CLICK VIRAL SOCIAL SHARING */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <a
            href={warpcastShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 bg-[#472a91] hover:bg-[#5835b0] text-white transition-all shadow-md hover:scale-[1.02]"
          >
            <Share2 size={14} />
            <span>Warpcast</span>
          </a>
          <a
            href={twitterShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 bg-black hover:bg-slate-900 text-white border border-slate-800 transition-all shadow-md hover:scale-[1.02]"
          >
            <Share2 size={14} />
            <span>X</span>
          </a>
          <a
            href={telegramShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 bg-[#229ED9] hover:bg-[#1d8ec4] text-white transition-all shadow-md hover:scale-[1.02]"
          >
            <Share2 size={14} />
            <span>Telegram</span>
          </a>
        </div>

        {/* TEST BUYER VIEW BUTTON */}
        <a
          href={`/buy/${createdSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all border-sky-300 dark:border-cyan-500/40 text-sky-700 dark:text-cyan-300 hover:bg-sky-50 dark:hover:bg-cyan-500/10"
        >
          <ExternalLink size={15} />
          {t('viewBuyerPage')}
        </a>

        {/* CREATE ANOTHER */}
        <button
          onClick={() => {
            setCreatedSlug(null);
            handleGenerateSlug();
          }}
          className="w-full py-3 cursor-pointer text-xs font-semibold uppercase tracking-wider transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          {t('createAnother')}
        </button>
      </div>
    );
  }

  // --- CREATION FORM + PREVIEW VIEW ---
  return (
    <div className="p-6 sm:p-7 rounded-[2.5rem] border backdrop-blur-2xl shadow-2xl relative transition-all duration-500 flex flex-col justify-between min-h-[570px] bg-white/90 dark:bg-slate-900/70 border-white dark:border-slate-800/90 shadow-xl dark:shadow-[0_0_50px_rgba(34,211,238,0.1)] shadow-blue-900/5">
      {/* TOP TAB HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/40 gap-2">
        {/* TABS SWITCHER */}
        <div className="flex items-center p-1 rounded-2xl border bg-slate-100 dark:bg-black/50 border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setCardTab('create')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              cardTab === 'create'
                ? 'bg-white dark:bg-cyan-500 text-slate-900 dark:text-black shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock size={13} />
            <span>{t('tabLockLink')}</span>
          </button>

          <button
            type="button"
            onClick={() => setCardTab('links')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              cardTab === 'links'
                ? 'bg-white dark:bg-cyan-500 text-slate-900 dark:text-black shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderLock size={13} />
            <span>{t('tabMyLinks')}</span>
          </button>

          <button
            type="button"
            onClick={() => setCardTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              cardTab === 'preview'
                ? 'bg-white dark:bg-cyan-500 text-slate-900 dark:text-black shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>{t('tabBuyerPreview')}</span>
          </button>
        </div>

        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
          Base • USDC
        </span>
      </div>

      {/* CARD BODY CONTENT */}
      <div className="py-4 text-left flex-1 min-h-[268px] grid grid-cols-1 grid-rows-1">
        {/* TAB 1: LOCK A LINK */}
        <div
          className={`col-start-1 row-start-1 transition-all duration-300 ease-in-out ${
            cardTab === 'create'
              ? 'opacity-100 translate-y-0 visible z-10'
              : 'opacity-0 -translate-y-1 invisible pointer-events-none z-0'
          }`}
        >
          <div className="space-y-3.5">
            {/* 1. URL / SECRET INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider ml-1 text-slate-500 dark:text-slate-400">
                {t('textToEncrypt')}
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-600" />
                <input
                  value={urlToLock}
                  onChange={(e) => setUrlToLock(e.target.value)}
                  type="text"
                  placeholder="https://... or secret payload text"
                  className="w-full p-2.5 pl-10 outline-none transition-all rounded-xl border text-sm bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900/80 focus:ring-2 focus:ring-sky-400 dark:focus:ring-0 dark:focus:border-cyan-500/60"
                />
              </div>
            </div>

            {/* 2. PRICE INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider ml-1 text-slate-500 dark:text-slate-400">
                {t('priceToUnencrypt')} ($ USDC)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 font-bold text-base text-slate-400 dark:text-slate-500">
                  $
                </span>
                <input
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setPrice(val);
                    }
                  }}
                  type="text"
                  inputMode="decimal"
                  placeholder="5.00"
                  className="w-full p-2 pl-8 outline-none transition-all font-bold text-base rounded-xl border bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900/80 focus:ring-2 focus:ring-sky-400 dark:focus:ring-0 dark:focus:border-cyan-500/60"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold font-mono text-cyan-500 dark:text-cyan-400">
                  USDC
                </span>
              </div>
            </div>

            {/* 3. SLUG INPUT */}
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('linkToPaymentPage')}
                </label>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <span className="absolute left-3 top-2 font-mono select-none text-sm text-slate-400 dark:text-slate-600">
                    /
                  </span>
                  <input
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                    }
                    type="text"
                    className="w-full p-2 pl-6 outline-none transition-all font-mono text-sm rounded-xl border bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-cyan-400 focus:bg-white dark:focus:bg-slate-900/80 focus:ring-2 focus:ring-sky-400 dark:focus:ring-0 dark:focus:border-cyan-500/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  disabled={isRefreshingSlug}
                  aria-label="Generate new slug"
                  className="p-2 rounded-xl transition-all border cursor-pointer bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-cyan-400 hover:bg-white dark:hover:bg-slate-800"
                >
                  <RefreshCw
                    size={15}
                    className={isRefreshingSlug ? 'animate-spin' : ''}
                  />
                </button>
              </div>
              <span className="text-[11px] block font-mono pl-1 opacity-70 text-blue-600 dark:text-cyan-400 truncate">
                Preview: linklockr.xyz/buy/{slug || 'slug'}
              </span>
            </div>
          </div>
        </div>

        {/* TAB 2: MY LINKS */}
        <div
          className={`col-start-1 row-start-1 transition-all duration-300 ease-in-out ${
            cardTab === 'links'
              ? 'opacity-100 translate-y-0 visible z-10'
              : 'opacity-0 -translate-y-1 invisible pointer-events-none z-0'
          }`}
        >
          {!authenticated || !activeAddress ? (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-4 space-y-3">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <FolderLock className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px]">
                {t('connectToViewLinks')}
              </p>
              <button
                type="button"
                onClick={login}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                {t('connectAndMint')}
              </button>
            </div>
          ) : isLoadingLinks ? (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-4 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500 dark:text-cyan-400" />
              <p className="text-xs text-slate-400 font-mono">Loading links...</p>
            </div>
          ) : myLinks.length === 0 ? (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-4 space-y-3">
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-400">
                <FolderLock className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('noLinksFound')}
              </p>
              <button
                type="button"
                onClick={() => setCardTab('create')}
                className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
              >
                + {t('tabLockLink')}
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[268px] overflow-y-auto pr-1">
              {myLinks.map((item) => (
                <div
                  key={item.slug}
                  className="p-3 rounded-2xl border bg-slate-50/80 dark:bg-black/40 border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2.5 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold capitalize text-slate-900 dark:text-white truncate">
                        {item.slug.replace(/-/g, ' ')}
                      </span>
                      {item.active && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check size={10} />
                          {t('verifiedOnBase')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      ${Number(item.price_usd || 0).toFixed(2)} USDC
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.slug)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer text-xs"
                      title={t('copyLink')}
                    >
                      {copiedLinkSlug === item.slug ? (
                        <Check size={13} className="text-emerald-500" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                    <a
                      href={`/buy/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer text-xs"
                      title={t('viewBuyerPage')}
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TAB 3: WHAT BUYERS SEE */}
        <div
          className={`col-start-1 row-start-1 transition-all duration-300 ease-in-out ${
            cardTab === 'preview'
              ? 'opacity-100 translate-y-0 visible z-10'
              : 'opacity-0 translate-y-1 invisible pointer-events-none z-0'
          }`}
        >
          <div className="space-y-2.5">
            {/* TOGGLE: SHOW LOCKED VS SHOW UNLOCKED */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Buyer Preview:
              </span>
              <div className="inline-flex items-center p-0.5 rounded-xl border transition-colors bg-slate-100 dark:bg-black/40 border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewMode('locked')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                    previewMode === 'locked'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {t('previewLocked')}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('unlocked')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                    previewMode === 'unlocked'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {t('previewUnlocked')}
                </button>
              </div>
            </div>

            {/* MOCK BUYER CARD PREVIEW */}
            <div className="h-[200px] p-4 rounded-2xl border transition-colors duration-300 relative overflow-hidden grid grid-cols-1 grid-rows-1 bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-slate-800/80">
              {/* LOCKED STATE PREVIEW */}
              <div
                className={`col-start-1 row-start-1 h-full flex flex-col justify-between text-center transition-all duration-300 ease-in-out ${
                  previewMode === 'locked'
                    ? 'opacity-100 scale-100 visible z-10'
                    : 'opacity-0 scale-95 invisible pointer-events-none z-0'
                }`}
              >
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-100/80 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-400 text-[10px] font-semibold uppercase tracking-wider mx-auto">
                  <FolderLock size={12} />
                  <span>Secure Content</span>
                </div>

                <h4 className="text-base font-extrabold capitalize tracking-tight truncate px-2 text-slate-900 dark:text-white">
                  {slug ? slug.replace(/-/g, ' ') : 'your link title'}
                </h4>

                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  $
                  {price && !isNaN(parseFloat(price))
                    ? parseFloat(price).toFixed(2)
                    : '5.00'}
                  <span className="text-xs font-semibold text-cyan-500 dark:text-cyan-400 ml-1">
                    USDC
                  </span>
                </div>

                <div className="py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-slate-200/80 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <Lock size={12} />
                  <span>Purchase & Unlock</span>
                </div>

                <p className="text-[10px] font-mono text-slate-500">
                  Base Network • Sub-Cent Gas • No Account Required
                </p>
              </div>

              {/* UNLOCKED STATE PREVIEW */}
              <div
                className={`col-start-1 row-start-1 h-full flex flex-col justify-between text-left transition-all duration-300 ease-in-out ${
                  previewMode === 'unlocked'
                    ? 'opacity-100 scale-100 visible z-10'
                    : 'opacity-0 scale-95 invisible pointer-events-none z-0'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                    <CheckCircle2 size={12} />
                    <span>Purchase Verified</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Decrypted
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Decrypted Secret Payload:
                  </label>
                  <div className="p-2.5 rounded-xl border font-mono text-xs break-all line-clamp-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-cyan-300">
                    {urlToLock || 'https://drive.google.com/file/d/your-secret-content'}
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={-1}
                  className="py-1.5 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer select-none hover:opacity-90 active:scale-[0.99] transition-all bg-emerald-100 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                >
                  <ExternalLink size={12} />
                  <span>Open Decrypted Link</span>
                </div>

                <p className="text-[10px] font-mono text-slate-500 text-center"></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PERSISTENT BOTTOM CTA */}
      {cardTab !== 'links' ? (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/40 space-y-2.5 text-left">
          {/* TERMS CHECKBOX */}
          <div className="flex items-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsTermsChecked(!isTermsChecked)}
              className="mt-0.5 shrink-0 cursor-pointer"
            >
              {isTermsChecked ? (
                <SquareCheckBig className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 dark:text-slate-600 hover:text-slate-500" />
              )}
            </button>
            <p
              onClick={() => setIsTermsChecked(!isTermsChecked)}
              className="text-[10px] leading-tight cursor-pointer select-none text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
            >
              {t('termsAgree')}
            </p>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            onClick={handleCreateLock}
            onMouseEnter={preloadPrivy}
            onTouchStart={preloadPrivy}
            disabled={isLoading}
            className="w-full font-bold py-3.5 transition-all flex items-center justify-center gap-2 rounded-2xl cursor-pointer text-xs uppercase tracking-wider bg-gradient-to-r from-sky-400 to-blue-600 dark:from-cyan-600 dark:to-blue-700 text-white hover:shadow-lg hover:shadow-sky-500/30 dark:hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />{' '}
                {statusMsg || t('processing')}
              </>
            ) : authenticated ? (
              <>
                <Zap size={16} fill="currentColor" className="text-white/80" />{' '}
                {t('encryptAndMint')}
              </>
            ) : (
              <>
                <Zap size={16} fill="currentColor" className="text-white/80" />{' '}
                {t('connectAndMint')}
              </>
            )}
          </button>

          {/* FINE PRINT FEE */}
          <p className="text-[10px] text-center font-mono opacity-60 leading-normal text-slate-500 dark:text-slate-400">
            {t('finePrintFee', { percent: percentFeeBps })}
          </p>
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/40 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={fetchMyLinks}
            disabled={isLoadingLinks}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={isLoadingLinks ? "animate-spin" : ""} />
            <span>{t('refreshLinks')}</span>
          </button>
          <button
            type="button"
            onClick={() => setCardTab('create')}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold transition-colors cursor-pointer"
          >
            + {t('tabLockLink')}
          </button>
        </div>
      )}
    </div>
  );
}
