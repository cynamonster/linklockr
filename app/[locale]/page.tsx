"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Lock, ArrowRight, Loader2, Zap, RefreshCw, 
  Copy, CheckCircle2, Shield, AlertCircle,
  Sun, Moon, FolderLock, ChevronDown, Wallet,
  Square, SquareCheckBig, Info, CircleX, X,
  ExternalLink, Share2, Sparkles, Check, LogOut
} from "lucide-react";
import { PrivyProvider, usePrivy, useWallets, ConnectedWallet } from "@privy-io/react-auth";
import { useTranslations } from 'next-intl';

// --- IMPORTS ---
import { supabase } from "../../utils/supabase";
import LanguageSwitcher from "../components/LanguageSwitcher";

// --- CONFIGURATION ---
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""; 
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""; 
// ABI for the USDC Smart Contract (price is in 6-decimal units for Base Native USDC)
const CONTRACT_ABI = [
  "function createLink(string _slug, uint256 _price, string _ipfsHash) external"
];

const NEXT_PUBLIC_FEE_BPS = process.env.NEXT_PUBLIC_FEE_BPS
        ? parseInt(process.env.NEXT_PUBLIC_FEE_BPS)
        : 250; // Default to 250 bps (2.5%);
const percentFeeBps = NEXT_PUBLIC_FEE_BPS / 100;

// --- THEME TOGGLE (Aero Style) ---
function ThemeToggle({ isDark, toggle }: { isDark: boolean, toggle: () => void }) {
  return (
    <button 
      onClick={toggle}
      aria-label="Toggle theme"
      className={`
        p-2 rounded-xl transition-all duration-300 border backdrop-blur-md cursor-pointer 
        ${isDark 
          ? "bg-slate-900/60 border-slate-700/80 text-cyan-400 hover:bg-slate-800 shadow-[0_0_15px_rgba(34,211,238,0.15)]" 
          : "bg-white/60 border-slate-200 text-sky-600 hover:bg-white shadow-sm"
        }
      `}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: { 
            theme: isDark ? 'dark' : 'light', 
            accentColor: isDark ? '#22d3ee' : '#3b82f6'
        },
        defaultChain: {
          id: 8453,
          name: 'Base',
          network: 'base',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: ['https://mainnet.base.org'] } }
        }
      }}
    >
      {/* MASTER WRAPPER */}
      <div className={`min-h-screen transition-colors duration-700 font-sans selection:bg-cyan-500/30
        ${isDark 
            ? 'bg-[#0B0C15] text-slate-200' 
            : 'bg-gradient-to-br from-sky-50 via-white to-blue-50 text-slate-900'
        }
      `}>
        {/* LIGHT MODE: SKY AURORA */}
        <div className={`fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sky-300/30 rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
        
        {/* DARK MODE: NEBULA GLOW */}
        <div className={`fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none transition-opacity duration-700 ${isDark ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`fixed top-[10%] left-[20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 ${isDark ? 'opacity-100' : 'opacity-0'}`} />
        
        <MainLogic isDark={isDark} toggleTheme={toggleTheme} />
      </div>
    </PrivyProvider>
  );
}

function MainLogic({ isDark, toggleTheme }: { isDark: boolean, toggleTheme: () => void }) {
  const t = useTranslations('CreatePage');

  const { authenticated, user, logout, login } = usePrivy();
  const { wallets } = useWallets();
  const [selectedAddress, setSelectedAddress] = useState("");
  useEffect(() => {
    if (wallets.length > 0 && !selectedAddress) {
      setSelectedAddress(wallets[0].address);
    }
  }, [wallets, selectedAddress]);

  // Wallet Drawer & Withdraw Form State
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ address: "", amount: "" });
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const activeWallet = wallets.find(w => w.address === selectedAddress) || wallets[0];

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Create Form State
  const [urlToLock, setUrlToLock] = useState("");
  const [price, setPrice] = useState("");
  const [slug, setSlug] = useState("");
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  
  // In-Place Card Tab & Preview States
  const [cardTab, setCardTab] = useState<'create' | 'preview'>('create');
  const [previewMode, setPreviewMode] = useState<'locked' | 'unlocked'>('locked');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Info Modal State
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const infoModalRef = useRef<HTMLDivElement | null>(null);

  // Draft persistence across session/Privy popup
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("linklockr_draft");
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
      sessionStorage.setItem("linklockr_draft", JSON.stringify({ urlToLock, price, slug, isTermsChecked }));
    } catch {}
  }, [urlToLock, price, slug, isTermsChecked]);

  // Close modals on outside click or Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsInfoOpen(false);
        setIsWalletDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Auto-generate slug on mount
  useEffect(() => { 
    if (!slug) generateNewSlug(); 
  }, []);

  const generateNewSlug = async () => {
    const { uniqueNamesGenerator, adjectives, colors, animals } = await import('unique-names-generator');
    const randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: '-',
      length: 3,
    });
    setSlug(randomName);
  };

  // --- CORE LOGIC: LIT ENCRYPTION & BASE MINT PIPELINE ---
  const handleCreateLock = async () => {
    if (!authenticated) {
      if (!urlToLock || !price || !slug) return alert(t('missingFields'));
      if (!isTermsChecked) return alert("Please agree to the terms to proceed.");
      return login();
    }

    const wallet = wallets.find(w => w.address === selectedAddress) || wallets[0]; 
    if (!wallet) return alert(t('pleaseConnectWallet'));
    if (!urlToLock || !price || !slug) return alert(t('missingFields'));
    if (!isTermsChecked) return alert("Please agree to the terms to proceed.");

    setIsLoading(true);
    try {
      const { ethers } = await import("ethers");
      // 1. SETUP
      setStatusMsg(t('status.connecting'));
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      
      // 2. CHECK AVAILABILITY & DB CONNECTION
      setStatusMsg(t('status.checking'));
      const { data: existing, error: checkError } = await supabase.from('links').select('slug').eq('slug', slug).maybeSingle();
      if (checkError) {
        console.error("Database connection check failed:", checkError);
        throw new Error(`Database connection failed: ${checkError.message || "Failed to reach database"}. Check your Supabase configuration before minting.`);
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

      // Save backup payload in localStorage in case network drops during/after minting
      const recoveryKey = `linklockr_recovery_${slug}`;
      const linkPayload: Record<string, any> = {
        slug,
        id_hash: slugHash,
        token_id: tokenId,
        ciphertext,
        creator: user?.wallet?.address || selectedAddress || (await signer.getAddress()),
        price_usd: 0,
        price_usdc: 0,
        price_eth: "0",
        price_wei: "0",
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
      await tx.wait();

      // 6. INDEX FOR DISCOVERY (Supabase)
      const { error: insertError } = await supabase.from('links').insert(linkPayload);

      if (insertError) {
        console.error('Supabase insert error after on-chain mint:', insertError);
        alert(`Transaction succeeded on-chain, but indexing in Supabase failed: ${insertError.message || "Failed to reach database"}. Your link record is saved in local storage.`);
        throw insertError;
      }

      try {
        localStorage.removeItem(recoveryKey);
        sessionStorage.removeItem("linklockr_draft");
      } catch {}

      setCreatedSlug(slug);
      setStatusMsg(t('status.success'));
      setUrlToLock("");
      setPrice("");
      generateNewSlug();

    } catch (e: any) {
      console.error(e);
      const msg = e.reason || e.message || "Unknown error";
      alert("Error: " + msg);
    }
    setIsLoading(false);
    setStatusMsg("");
  };

  // --- WITHDRAW LOGIC ---
  const handleWithdraw = async () => {
    if (!activeWallet || !withdrawForm.address || !withdrawForm.amount) return;
    setIsWithdrawing(true);
    try {
      const { ethers } = await import("ethers");
      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const tx = await signer.sendTransaction({
        to: withdrawForm.address,
        value: ethers.parseEther(withdrawForm.amount),
      });
      await tx.wait();
      alert(`Sent ${withdrawForm.amount} ETH`);
      setWithdrawForm({ address: "", amount: "" });
    } catch (e: any) {
      alert(e.message || String(e));
    }
    setIsWithdrawing(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- VIEW: SUCCESS CELEBRATION SCREEN ---
  if (createdSlug) {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/buy/${createdSlug}` : `https://linklockr.xyz/buy/${createdSlug}`;
    const warpcastShareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`Check out my paywalled link on LinkLockr:\n${shareUrl}`)}`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my paywalled link on LinkLockr:\n${shareUrl}`)}`;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`
          max-w-lg w-full p-8 md:p-10 rounded-[2.5rem] border text-center space-y-6 backdrop-blur-2xl shadow-2xl transition-all
          ${isDark ? "bg-slate-900/80 border-slate-700/80 shadow-cyan-950/20" : "bg-white/90 border-white shadow-blue-900/10"}
        `}>
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg
            ${isDark ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.25)]" : "bg-green-100 text-green-600 shadow-green-500/20"}
          `}>
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              {t('linkCreated')}
            </h2>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {t('linkCreated_desc')}
            </p>
          </div>

          {/* LINK COPY BAR */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${isDark ? "bg-black/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <code className={`text-sm font-mono truncate text-left ${isDark ? "text-cyan-400" : "text-blue-600"}`}>
              {shareUrl}
            </code>
            <button 
              onClick={() => handleCopy(shareUrl)}
              className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold ${
                isCopied 
                  ? "bg-cyan-500 text-black font-bold" 
                  : (isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white" : "bg-white hover:bg-slate-100 text-slate-700")
              }`}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              <span>{isCopied ? t('copied') : t('copyShareLink')}</span>
            </button>
          </div>

          {/* 1-CLICK SOCIAL SHARING */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a 
              href={warpcastShareUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#472a91] hover:bg-[#5835b0] text-white transition-all shadow-md hover:scale-[1.02]"
            >
              <Share2 size={15} />
              {t('shareWarpcast')}
            </a>
            <a 
              href={twitterShareUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-black hover:bg-slate-900 text-white border border-slate-800 transition-all shadow-md hover:scale-[1.02]"
            >
              <Share2 size={15} />
              {t('shareTwitter')}
            </a>
          </div>

          {/* TEST BUYER VIEW BUTTON */}
          <a 
            href={`/buy/${createdSlug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
              isDark 
                ? "border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10" 
                : "border-sky-300 text-sky-700 hover:bg-sky-50"
            }`}
          >
            <ExternalLink size={15} />
            {t('viewBuyerPage')}
          </a>

          {/* CREATE ANOTHER */}
          <button 
            onClick={() => {
              setCreatedSlug(null);
              generateNewSlug();
            }} 
            className={`w-full py-3 cursor-pointer text-xs font-semibold uppercase tracking-wider transition-colors ${
              isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {t('createAnother')}
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: HYBRID HERO + IN-PLACE CREATION ---
  return (
    <div className="relative min-h-screen">
      {/* TOP NAVIGATION BAR */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        {/* BRAND LOGO */}
        <div className="flex items-center gap-3">
          <div className={`
            p-2.5 rounded-2xl border transition-all
            ${isDark 
              ? "bg-slate-900/60 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
              : "bg-gradient-to-tr from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/20"}
          `}>
            <FolderLock className="w-5 h-5" />
          </div>
          <div>
            <span className={`font-extrabold text-xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              LinkLockr
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[10px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
                Base • USDC
              </span>
            </div>
          </div>
        </div>

        {/* CONTROLS & WALLET PILL */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          
          <button
            onClick={() => setIsInfoOpen(true)}
            aria-label={t('linkInfo')}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              isDark 
                ? "bg-slate-900/60 border-slate-700/80 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800" 
                : "bg-white/60 border-slate-200 text-sky-600 hover:text-sky-500 hover:bg-white"
            }`}
          >
            <Info size={17} />
          </button>

          <ThemeToggle isDark={isDark} toggle={toggleTheme} />

          {/* AUTH WALLET BUTTON */}
          {authenticated && activeWallet ? (
            <button
              onClick={() => setIsWalletDrawerOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
                isDark 
                  ? "bg-slate-900/80 border-cyan-500/40 text-cyan-300 hover:bg-slate-800 shadow-[0_0_10px_rgba(34,211,238,0.15)]" 
                  : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{formatAddress(selectedAddress || activeWallet.address)}</span>
              <ChevronDown size={14} className="opacity-60" />
            </button>
          ) : (
            <button
              onClick={login}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                isDark 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-[1.02]" 
                  : "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:shadow-md hover:scale-[1.02]"
              }`}
            >
              <Zap size={14} fill="currentColor" />
              <span>{t('connectWallet')}</span>
            </button>
          )}
        </div>
      </header>

      {/* HERO & IN-PLACE CREATION CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT: VALUE PROPOSITION */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
              isDark ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-400" : "bg-sky-100/80 border-sky-300 text-sky-800"
            }`}>
              <Sparkles size={14} />
              <span>Base L2 • Instant USDC Settlement</span>
            </div>

            <h1 className={`text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              {t('heroTitle')}
            </h1>

            <p className={`text-base sm:text-xl font-normal leading-relaxed ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}>
              {t('heroSubtitle')}
            </p>

            {/* TRUST PILL BADGES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className={`p-4 rounded-2xl border transition-all ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-white/80 border-slate-200 shadow-sm"
              }`}>
                <Shield className="w-5 h-5 text-cyan-400 mb-1.5" />
                <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Lit Protocol TEE</h4>
                <p className="text-xs text-slate-500 mt-0.5">Encrypted client/server condition</p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-white/80 border-slate-200 shadow-sm"
              }`}>
                <Zap className="w-5 h-5 text-cyan-400 mb-1.5" />
                <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Sub-Cent Gas</h4>
                <p className="text-xs text-slate-500 mt-0.5">Base L2 sub-penny mint & buy</p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-white/80 border-slate-200 shadow-sm"
              }`}>
                <Lock className="w-5 h-5 text-cyan-400 mb-1.5" />
                <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Zero Chargebacks</h4>
                <p className="text-xs text-slate-500 mt-0.5">Instant non-reversible USDC</p>
              </div>
            </div>
          </div>

          {/* RIGHT: IN-PLACE CREATION CARD WITH TABS & PREVIEW */}
          <div className="lg:col-span-5">
            <div className={`
              p-6 sm:p-7 rounded-[2.5rem] border backdrop-blur-2xl shadow-2xl relative transition-all duration-500 flex flex-col justify-between min-h-[570px]
              ${isDark 
                ? "bg-slate-900/70 border-slate-800/90 shadow-[0_0_50px_rgba(34,211,238,0.1)]" 
                : "bg-white/90 border-white shadow-xl shadow-blue-900/5"}
            `}>
              
              {/* TOP TAB HEADER */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/40 gap-2">
                {/* TABS SWITCHER */}
                <div className={`flex items-center p-1 rounded-2xl border ${
                  isDark ? "bg-black/50 border-slate-800" : "bg-slate-100 border-slate-200"
                }`}>
                  <button
                    type="button"
                    onClick={() => setCardTab('create')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      cardTab === 'create'
                        ? (isDark ? "bg-cyan-500 text-black shadow-sm" : "bg-white text-slate-900 shadow-sm")
                        : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
                    }`}
                  >
                    <Lock size={13} />
                    <span>{t('tabLockLink')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      cardTab === 'preview'
                        ? (isDark ? "bg-cyan-500 text-black shadow-sm" : "bg-white text-slate-900 shadow-sm")
                        : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>{t('tabBuyerPreview')}</span>
                  </button>
                </div>

                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                  Base • USDC
                </span>
              </div>

              {/* CARD BODY CONTENT WITH STABLE CONTAINER & SMOOTH CROSSFADE */}
              <div className="py-4 text-left flex-1 relative min-h-[268px]">
                {/* TAB 1: LOCK A LINK */}
                <div className={`transition-all duration-300 ease-in-out ${
                  cardTab === 'create' 
                    ? 'opacity-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 -translate-y-1 pointer-events-none absolute inset-x-0 top-4'
                }`}>
                  <div className="space-y-3.5">
                    {/* 1. URL / SECRET INPUT */}
                    <div className="space-y-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {t('textToEncrypt')}
                      </label>
                      <div className="relative">
                        <Shield className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                        <input 
                          value={urlToLock}
                          onChange={(e) => setUrlToLock(e.target.value)}
                          type="text" 
                          placeholder="https://... or secret payload text" 
                          className={`
                            w-full p-2.5 pl-10 outline-none transition-all rounded-xl border text-sm
                            ${isDark 
                              ? "bg-black/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/60 focus:bg-slate-900/80" 
                              : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-400"}
                          `}
                        />
                      </div>
                    </div>

                    {/* 2. PRICE INPUT */}
                    <div className="space-y-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {t('priceToUnencrypt')} ($ USDC)
                      </label>
                      <div className="relative">
                        <span className={`absolute left-3.5 top-2 font-bold text-base ${isDark ? "text-slate-500" : "text-slate-400"}`}>$</span>
                        <input 
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          type="number" 
                          step="0.01"
                          min="0.01"
                          placeholder="5.00" 
                          className={`
                            w-full p-2 pl-8 outline-none transition-all font-bold text-base rounded-xl border
                            ${isDark 
                              ? "bg-black/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-500/60 focus:bg-slate-900/80" 
                              : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-400"}
                          `}
                        />
                        <span className="absolute right-3.5 top-2.5 text-xs font-bold font-mono text-cyan-400">USDC</span>
                      </div>
                    </div>

                    {/* 3. SLUG INPUT */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center ml-1">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {t('linkToPaymentPage')}
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1 group">
                          <span className={`absolute left-3 top-2 font-mono select-none text-sm ${isDark ? "text-slate-600" : "text-slate-400"}`}>/</span>
                          <input 
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                            type="text" 
                            className={`
                              w-full p-2 pl-6 outline-none transition-all font-mono text-sm rounded-xl border
                              ${isDark 
                                ? "bg-black/50 border-slate-800 text-cyan-400 focus:border-cyan-500/60 focus:bg-slate-900/80" 
                                : "bg-slate-50 border-slate-200 text-blue-600 focus:bg-white focus:ring-2 focus:ring-sky-400"}
                            `}
                          />
                        </div>
                        <button 
                          onClick={generateNewSlug}
                          aria-label="Generate new slug"
                          className={`
                            p-2 rounded-xl transition-all border cursor-pointer
                            ${isDark 
                              ? "bg-slate-800/60 border-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-800" 
                              : "bg-slate-100 border-slate-200 text-slate-500 hover:text-sky-600 hover:bg-white"}
                          `}
                        >
                          <RefreshCw size={15} />
                        </button>
                      </div>
                      <span className={`text-[11px] block font-mono pl-1 opacity-70 ${isDark ? "text-cyan-400" : "text-blue-600"}`}>
                        Preview: linklockr.xyz/buy/{slug || "slug"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TAB 2: WHAT BUYERS SEE */}
                <div className={`transition-all duration-300 ease-in-out ${
                  cardTab === 'preview' 
                    ? 'opacity-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 translate-y-1 pointer-events-none absolute inset-x-0 top-4'
                }`}>
                  <div className="space-y-2.5">
                    {/* TOGGLE: SHOW LOCKED VS SHOW UNLOCKED */}
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Buyer Preview:
                      </span>
                      <div className={`inline-flex items-center p-0.5 rounded-xl border transition-colors ${
                        isDark ? "bg-black/40 border-slate-800" : "bg-slate-100 border-slate-200"
                      }`}>
                        <button
                          type="button"
                          onClick={() => setPreviewMode('locked')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                            previewMode === 'locked'
                              ? (isDark ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-xs" : "bg-white text-slate-900 shadow-xs")
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {t('previewLocked')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode('unlocked')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                            previewMode === 'unlocked'
                              ? (isDark ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-xs" : "bg-white text-slate-900 shadow-xs")
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {t('previewUnlocked')}
                        </button>
                      </div>
                    </div>

                    {/* MOCK BUYER CARD PREVIEW WITH STABLE HEIGHT & FADE */}
                    <div className={`h-[200px] p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      isDark ? "bg-black/50 border-slate-800/80" : "bg-slate-50 border-slate-200"
                    }`}>
                      {/* LOCKED STATE PREVIEW */}
                      <div className={`transition-all duration-300 ease-in-out h-full flex flex-col justify-between text-center ${
                        previewMode === 'locked' 
                          ? 'opacity-100 scale-100 pointer-events-auto' 
                          : 'opacity-0 scale-95 pointer-events-none absolute inset-4'
                      }`}>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold uppercase tracking-wider mx-auto">
                          <FolderLock size={12} />
                          <span>Secure Content</span>
                        </div>

                        <h4 className={`text-base font-extrabold capitalize tracking-tight truncate px-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                          {slug ? slug.replace(/-/g, ' ') : "your link title"}
                        </h4>

                        <div className="text-2xl font-black text-white">
                          ${price ? parseFloat(price).toFixed(2) : "5.00"} 
                          <span className="text-xs font-semibold text-cyan-400 ml-1">USDC</span>
                        </div>

                        <div className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                          isDark ? "bg-slate-800/70 border-slate-700 text-slate-300" : "bg-slate-200/80 border-slate-300 text-slate-700"
                        }`}>
                          <Lock size={12} />
                          <span>Purchase & Unlock</span>
                        </div>

                        <p className="text-[10px] font-mono text-slate-500">
                          Base Network • Sub-Cent Gas • No Account Required
                        </p>
                      </div>

                      {/* UNLOCKED STATE PREVIEW */}
                      <div className={`transition-all duration-300 ease-in-out h-full flex flex-col justify-between text-left ${
                        previewMode === 'unlocked' 
                          ? 'opacity-100 scale-100 pointer-events-auto' 
                          : 'opacity-0 scale-95 pointer-events-none absolute inset-4'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                            <CheckCircle2 size={12} />
                            <span>Purchase Verified</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold">Decrypted</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Decrypted Secret Payload:
                          </label>
                          <div className={`p-2.5 rounded-xl border font-mono text-xs break-all line-clamp-2 ${
                            isDark ? "bg-slate-950 border-slate-800 text-cyan-300" : "bg-white border-slate-200 text-blue-600"
                          }`}>
                            {urlToLock || "https://drive.google.com/file/d/your-secret-content"}
                          </div>
                        </div>

                        <div className={`py-1.5 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                          isDark ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}>
                          <ExternalLink size={12} />
                          <span>Open Decrypted Link</span>
                        </div>

                        <p className="text-[10px] font-mono text-slate-500 text-center">
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PERSISTENT BOTTOM CTA (Always visible & interactive across both tabs) */}
              <div className="pt-3 border-t border-slate-800/40 space-y-2.5 text-left">
                {/* TERMS CHECKBOX */}
                <div className="flex items-start gap-2 pt-1">
                  <button 
                    type="button"
                    onClick={() => setIsTermsChecked(!isTermsChecked)}
                    className="mt-0.5 shrink-0 cursor-pointer"
                  >
                    {isTermsChecked ? (
                      <SquareCheckBig className={`w-4 h-4 ${isDark ? "text-cyan-400" : "text-blue-600"}`} />
                    ) : (
                      <Square className={`w-4 h-4 ${isDark ? "text-slate-600 hover:text-slate-500" : "text-slate-400"}`} />
                    )}
                  </button>
                  <p 
                    onClick={() => setIsTermsChecked(!isTermsChecked)}
                    className={`text-[10px] leading-tight cursor-pointer select-none ${isDark ? "text-slate-500 hover:text-slate-400" : "text-slate-500"}`}
                  >
                    {t('termsAgree')}
                  </p>
                </div>

                {/* SUBMIT BUTTON */}
                <button 
                  onClick={handleCreateLock}
                  disabled={isLoading}
                  className={`
                    w-full font-bold py-3.5 transition-all flex items-center justify-center gap-2 rounded-2xl cursor-pointer text-xs uppercase tracking-wider
                    ${isDark 
                      ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-[1.01]" 
                      : "bg-gradient-to-r from-sky-400 to-blue-600 text-white hover:shadow-lg hover:shadow-sky-500/30 hover:scale-[1.01]"}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isLoading ? (
                    <><Loader2 className="animate-spin" size={16} /> {statusMsg || t('processing')}</>
                  ) : authenticated ? (
                    <><Zap size={16} fill="currentColor" className="text-white/80" /> {t('encryptAndMint')}</>
                  ) : (
                    <><Zap size={16} fill="currentColor" className="text-white/80" /> {t('connectAndMint')}</>
                  )}
                </button>

                {/* FINE PRINT FEE */}
                <p className={`text-[10px] text-center font-mono opacity-60 leading-normal ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t('finePrintFee', { percent: percentFeeBps })}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* SECTION: HOW IT WORKS */}
        <section className="mt-28 text-left space-y-10">
          <div className="text-center space-y-3">
            <h2 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              {t('howItWorksTitle')}
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Decentralized link vending with zero intermediaries. Non-custodial, peer-to-peer settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold mb-4">
                01
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {t('howStep1Title')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('howStep1Desc')}
              </p>
            </div>

            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold mb-4">
                02
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {t('howStep2Title')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('howStep2Desc')}
              </p>
            </div>

            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold mb-4">
                03
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {t('howStep3Title')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('howStep3Desc')}
              </p>
            </div>

            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold mb-4">
                04
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {t('howStep4Title')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('howStep4Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: USE CASES */}
        <section className="mt-28 text-left space-y-10">
          <div className="text-center space-y-3">
            <h2 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              {t('useCasesTitle')}
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Any piece of high-value information or link can be instantly monetized.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-7 rounded-3xl border transition-all ${
              isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Sparkles size={20} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {t('useCase1Title')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('useCase1Desc')}
              </p>
            </div>

            <div className={`p-7 rounded-3xl border transition-all ${
              isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <FolderLock size={20} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {t('useCase2Title')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('useCase2Desc')}
              </p>
            </div>

            <div className={`p-7 rounded-3xl border transition-all ${
              isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Shield size={20} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {t('useCase3Title')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('useCase3Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-32 pt-10 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <FolderLock size={15} className="text-cyan-400" />
            <span className="font-bold text-slate-300">LinkLockr</span>
            <span>• Base Smart Contract USDC</span>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href={`https://basescan.org/address/${CONTRACT_ADDRESS}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <span>BaseScan Contract</span>
              <ExternalLink size={12} />
            </a>

            <a 
              href="mailto:copyright@linklockr.xyz" 
              className="hover:text-cyan-400 transition-colors"
            >
              DMCA / Copyright (copyright@linklockr.xyz)
            </a>
          </div>
        </footer>
      </main>

      {/* WALLET SLIDEOVER DRAWER (Refactored to side) */}
      {isWalletDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsWalletDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Wallet size={18} className="text-cyan-400" />
                  <h3 className="text-base font-bold text-white">
                    {t('walletDrawerTitle')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsWalletDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ACTIVE WALLET SELECTOR */}
              <div className="p-5 rounded-2xl bg-black/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
                  <span>{t('activeWallet')}</span>
                  {wallets.length > 1 && (
                    <span className="bg-white/10 px-2 py-0.5 rounded-full text-slate-300 text-[10px]">
                      {t('connectedCount', { count: wallets.length })}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <select 
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="w-full appearance-none bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm font-mono text-cyan-300 outline-none cursor-pointer pr-8"
                  >
                    {wallets.map((w) => (
                      <option key={w.address} value={w.address} className="bg-slate-900 text-slate-200 font-sans">
                        {formatAddress(w.address)} ({w.walletClientType === 'privy' ? t('embedded') : w.walletClientType})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                </div>

                <p className="text-[11px] text-slate-500">
                  {activeWallet?.walletClientType === 'privy' ? t('embeddedWallet') : t('externalWallet')}
                </p>
              </div>

              {/* WITHDRAW ETH FORM */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('withdrawFunds')}
                </h4>
                <div className="space-y-2">
                  <input 
                    value={withdrawForm.address}
                    onChange={(e) => setWithdrawForm({...withdrawForm, address: e.target.value})}
                    placeholder="0x Destination address..." 
                    className="w-full p-3 rounded-xl bg-black/40 border border-slate-800 text-sm font-mono text-white placeholder:text-slate-600 outline-none focus:border-cyan-500" 
                  />
                  <input 
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                    placeholder="Amount (ETH)" 
                    type="number"
                    step="0.001"
                    className="w-full p-3 rounded-xl bg-black/40 border border-slate-800 text-sm font-mono text-white placeholder:text-slate-600 outline-none focus:border-cyan-500" 
                  />
                </div>
                <button 
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawForm.address || !withdrawForm.amount}
                  className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isWithdrawing ? <Loader2 className="animate-spin mx-auto" size={16} /> : t('sendEth')}
                </button>
              </div>
            </div>

            {/* LOGOUT BUTTON */}
            <div className="pt-6 border-t border-slate-800">
              <button 
                onClick={() => {
                  logout();
                  setIsWalletDrawerOpen(false);
                }}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={15} />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INFO MODAL */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsInfoOpen(false)}
          />
          <div
            ref={infoModalRef}
            className={`
              w-full max-w-xl p-6 sm:p-8 rounded-3xl shadow-2xl relative z-10 text-left border animate-in fade-in zoom-in-95 duration-200
              ${isDark ? "bg-slate-900 text-slate-100 border-slate-800" : "bg-white text-slate-900 border-slate-200"}
            `}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-800/40">
              <h3 className="text-lg font-bold">
                {t('modalTitle')}
              </h3>
              <button
                onClick={() => setIsInfoOpen(false)}
                aria-label="Close info"
                className={`p-1 rounded-lg cursor-pointer transition-all ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
              >
                <CircleX size={20} />
              </button>
            </div>

            <div className="mt-4 text-sm leading-relaxed space-y-4">
              <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                {t('modalDescription')}
              </p>

              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isDark ? "bg-cyan-600 text-black" : "bg-sky-100 text-sky-700"}`}>
                    1
                  </div>
                  <div>
                    <div className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{t('step1')}</div>
                    <div className="text-xs opacity-80 mt-0.5">{t('step1_desc')}</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isDark ? "bg-cyan-600 text-black" : "bg-sky-100 text-sky-700"}`}>
                    2
                  </div>
                  <div>
                    <div className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{t('step2')}</div>
                    <div className="text-xs opacity-80 mt-0.5">{t('step2_desc')}</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isDark ? "bg-cyan-600 text-black" : "bg-sky-100 text-sky-700"}`}>
                    3
                  </div>
                  <div>
                    <div className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{t('step3')}</div>
                    <div className="text-xs opacity-80 mt-0.5">{t('step3_desc')}</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isDark ? "bg-cyan-600 text-black" : "bg-sky-100 text-sky-700"}`}>
                    4
                  </div>
                  <div>
                    <div className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{t('step4')}</div>
                    <div className="text-xs opacity-80 mt-0.5">{t('step4_desc', { percent: percentFeeBps })}</div>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
