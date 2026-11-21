"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { PrivyProvider, usePrivy, useWallets, useFundWallet } from "@privy-io/react-auth";
import { FolderLock, Unlock, Loader2, AlertCircle, ExternalLink, Check, Shield, ShieldAlert, Sparkles, Copy, ChevronDown, Wallet, LogOut, CreditCard } from "lucide-react";
import { useTranslations } from 'next-intl';

// --- IMPORTS ---
import { supabase } from "@/utils/supabase";
import { createSiweMessage } from "@/utils/lit";
import { ensureBaseChain } from "@/utils/chainGuard";
import { ReportButton } from "@/app/components/ReportButton";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

// --- CONFIG ---
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""; 
const PLATFORM_FEE_RECIPIENT = process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT; 

const NEXT_PUBLIC_FEE_BPS = process.env.NEXT_PUBLIC_FEE_BPS
  ? parseInt(process.env.NEXT_PUBLIC_FEE_BPS)
  : 500; // Default to 500 bps (5%);

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const LINK_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function buyLink(string _slug, address _recipient, address _feeRecipient, uint256 _feeBps) external",
  "function links(bytes32) view returns (uint256 price, address creator, bool active, string ipfsHash, string slug)"
];

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

interface BuyClientWrapperProps {
  slug: string;
  initialLinkData?: any;
  initialError?: string | null;
}

export default function BuyClientWrapper({ slug, initialLinkData, initialError }: BuyClientWrapperProps) {    
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: { 
            theme: 'dark', 
            accentColor: '#22d3ee', 
            logo: 'https://linklockr.xyz/logo.png'
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
          rpcUrls: { default: { http: ['https://mainnet.base.org'] } }
        },
        supportedChains: [
          {
            id: 8453,
            name: 'Base',
            network: 'base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: ['https://mainnet.base.org'] } }
          }
        ]
      }}
    >
      <BuyPageContent slug={slug} initialLinkData={initialLinkData} initialError={initialError} />
    </PrivyProvider>
  );
}

function BuyPageContent({ slug, initialLinkData, initialError }: BuyClientWrapperProps) {
  const { authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();
  
  const t = useTranslations('BuyPage');

  // -- WALLETS --
  const [selectedAddress, setSelectedAddress] = useState("");

  useEffect(() => {
    if (wallets.length > 0 && !selectedAddress) {
      // Prefer the wallet designated as active by Privy or the last connected external wallet
      const primary = wallets.find(w => w.address === user?.wallet?.address) || wallets[0];
      setSelectedAddress(primary.address);
    }
  }, [wallets, selectedAddress, user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
    setSelectedAddress("");
    setIsOwner(false);
  };

  const [ethBalance, setEthBalance] = useState("0.0000");
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);

  // Clear or reset balance display when selectedAddress changes so balances from prior wallets never linger on screen
  useEffect(() => {
    if (selectedAddress) {
      setIsFetchingBalance(true);
      setEthBalance("0.0000");
      setUsdcBalance("0.00");
    }
  }, [selectedAddress]);

  // Fetch balances for active address
  const fetchBalance = useCallback(async () => {
    const targetAddr = selectedAddress || wallets[0]?.address;
    if (!targetAddr) return;
    setIsFetchingBalance(true);

    try {
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      
      const rawEth = await provider.getBalance(targetAddr);
      setEthBalance(ethers.formatEther(rawEth));

      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
      const rawUsdc = await usdc.balanceOf(targetAddr);
      setUsdcBalance(ethers.formatUnits(rawUsdc, 6));
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setIsFetchingBalance(false);
    }
  }, [selectedAddress, wallets]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const activeWallet = wallets.find(w => w.address === selectedAddress) || wallets[0];

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Data State: Instantly populated by server pre-fetch
  const [linkData, setLinkData] = useState<any>(initialLinkData || null);
  const [loading, setLoading] = useState(!initialLinkData && !initialError);
  const [error, setError] = useState(initialError || "");
  const [isBanned, setIsBanned] = useState(initialLinkData?.status === 'banned');

  // Hybrid 18+ Mode State
  const isSensitive = Boolean(linkData?.is_sensitive || linkData?.status === 'flagged');
  const [hasConfirmedAge, setHasConfirmedAge] = useState(false);

  // On-Chain Link Status State
  const [isOnChainActive, setIsOnChainActive] = useState<boolean | null>(null);
  const [isVerifyingOnChain, setIsVerifyingOnChain] = useState<boolean>(true);

  useEffect(() => {
    const verifyOnChain = async () => {
      if (!slug) return;
      try {
        const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LINK_ABI, provider);
        const normalized = slug.trim();
        const slugBytes = ethers.toUtf8Bytes(normalized);
        const slugHash = ethers.keccak256(ethers.solidityPacked(['bytes'], [slugBytes]));
        const link = await contract.links(slugHash);
        setIsOnChainActive(Boolean(link.active));
      } catch (err) {
        console.warn("On-chain verification warning:", err);
        setIsOnChainActive(null);
      } finally {
        setIsVerifyingOnChain(false);
      }
    };

    verifyOnChain();
  }, [slug]);

  // Transaction State
  const [txStatus, setTxStatus] = useState("");
  const [txStep, setTxStep] = useState<"" | "approving" | "buying" | "indexing" | "decrypting">("");
  const [isOwner, setIsOwner] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  
  // UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy!', err);
    }
  };

  const isCreator = authenticated && linkData && activeWallet && 
    (linkData.creator.toLowerCase() === activeWallet.address.toLowerCase());

  useEffect(() => {
    if (slug && !linkData && !error) {
      fetchLinkData();
    }
  }, [slug, linkData, error]);

  useEffect(() => {
    if (authenticated && wallets.length > 0 && linkData) {
      checkOwnership();
    }
  }, [authenticated, wallets, linkData]);

  // A. FETCH METADATA (Client Fallback)
  const fetchLinkData = async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) throw new Error("Link not found or has been removed.");
      if (!data.active) throw new Error("This link has been suspended due to reports.");
      
      setLinkData(data);
      if (data.status === 'banned') setIsBanned(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // B. CHECK OWNERSHIP
  const checkOwnership = async () => {
    try {
      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LINK_ABI, ethersProvider);
      
      const slugBytes = ethers.toUtf8Bytes(slug as string);
      const slugHash = ethers.keccak256(ethers.solidityPacked(['bytes'], [slugBytes]));
      const tokenId = BigInt(slugHash).toString();

      const balance = await contract.balanceOf(activeWallet.address, tokenId);
      if (balance > BigInt(0)) setIsOwner(true);
    } catch (e) {
      console.error("Ownership check failed", e);
    }
  };

  // FUNDING FLOW (Cross-Chain Bridging & Card Onramp)
  const handleFundWallet = async () => {
    const targetAddr = activeWallet?.address;
    if (!targetAddr) return login();

    try {
      const priceNum = Number(linkData?.price_usd || 0);
      const formattedAmount = priceNum > 0 ? priceNum.toFixed(2) : "5.00";

      await fundWallet({
        address: targetAddr,
        options: {
          chain: { id: 8453 },
          amount: formattedAmount,
          asset: 'USDC',
        },
      });

      // Re-fetch balance after funding flow completes
      setTimeout(() => {
        fetchBalance();
      }, 1500);
    } catch (err: any) {
      console.warn("Funding flow notice:", err);
    }
  };

  // C. PURCHASE FLOW
  const handleBuy = async () => {
    if (!activeWallet) return login();
    
    setTxStatus("preparing");
    setTxStep("approving");
    setError("");

    try {
      await ensureBaseChain(activeWallet);
      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const userAddress = await signer.getAddress();

      // Check 0: On-chain Link Verification
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LINK_ABI, signer);
      const normalizedSlug = (slug || "").trim();
      const slugBytes = ethers.toUtf8Bytes(normalizedSlug);
      const slugHash = ethers.keccak256(ethers.solidityPacked(['bytes'], [slugBytes]));

      const linkOnChain = await contract.links(slugHash);
      if (!linkOnChain.active) {
        throw new Error(t('linkInactiveDesc'));
      }

      // Check 1: Gas (ETH)
      const ethBalanceVal = await ethersProvider.getBalance(userAddress);
      const estimatedEthForGas = ethers.parseEther("0.00003");

      if (ethBalanceVal < estimatedEthForGas) {
        throw new Error(t('insufficientGas'));
      }

      // Check 2: Price in USDC units
      let priceUnits: bigint;
      if (linkData.price_wei && BigInt(linkData.price_wei) > BigInt(0) && BigInt(linkData.price_wei) < BigInt("1000000000000000")) {
        priceUnits = BigInt(linkData.price_wei);
      } else {
        priceUnits = ethers.parseUnits(Number(linkData.price_usd || 0).toFixed(6), 6);
      }

      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const userUsdcBalance: bigint = await usdcContract.balanceOf(userAddress);

      if (userUsdcBalance < priceUnits) {
        const currentUsdc = ethers.formatUnits(userUsdcBalance, 6);
        const requiredUsdc = ethers.formatUnits(priceUnits, 6);
        throw new Error(`Insufficient USDC balance. You have $${Number(currentUsdc).toFixed(2)} USDC, but this item costs $${Number(requiredUsdc).toFixed(2)} USDC.`);
      }

      // Check 3: Allowance
      const currentAllowance: bigint = await usdcContract.allowance(userAddress, CONTRACT_ADDRESS);
      if (currentAllowance < priceUnits) {
        setTxStep("approving");
        setTxStatus("approving USDC (1/2)...");
        const txApprove = await usdcContract.approve(CONTRACT_ADDRESS, priceUnits);
        await txApprove.wait();
      }

      // Action: Buy
      setTxStep("buying");
      setTxStatus("unlocking content (2/2)...");

      const txBuy = await contract.buyLink(
        normalizedSlug, 
        userAddress, 
        PLATFORM_FEE_RECIPIENT, 
        NEXT_PUBLIC_FEE_BPS
      );
      await txBuy.wait();

      // Trigger Discord sales feed notification (non-blocking)
      fetch('/api/notify-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          buyer: userAddress,
          priceUsd: linkData.price_usd || ethers.formatUnits(priceUnits, 6),
          txHash: txBuy.hash,
        }),
      }).catch(err => console.warn("Discord sales notification warning:", err));

      setIsOwner(true);
      try {
        const key = `linklockr_purchases_${userAddress.toLowerCase()}`;
        const stored: string[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (!stored.includes(slug)) {
          stored.push(slug);
          localStorage.setItem(key, JSON.stringify(stored));
        }
      } catch {}

      setTxStep("indexing");
      setTxStatus("indexing...");

      await new Promise((resolve) => setTimeout(resolve, 2000)); 

      setTxStep("");
      setTxStatus("");
      fetchBalance();
      handleDecrypt();

    } catch (e: any) {
      console.error(e);
      let msg = e.reason || e.message;
      
      if (msg.includes("user rejected")) msg = "Transaction cancelled.";
      else if (msg.includes("insufficient funds")) msg = "Insufficient ETH for gas or insufficient USDC.";
      
      alert(msg);
      setTxStep("");
      setTxStatus("");
    }
  };

  // D. DECRYPT FLOW
  const handleDecrypt = async () => {
    if (!activeWallet) return;
    setTxStatus("decrypting");
    setError("");

    try {
      await ensureBaseChain(activeWallet);
      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const userAddress = await signer.getAddress();

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

      const res = await fetch("/api/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, message, signature }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to decrypt");

      setDecryptedUrl(data.url);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setTxStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Bar with Language Switcher */}
      <div className="fixed top-4 right-4 z-40">
        <LanguageSwitcher />
      </div>

      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 space-y-8 transition-all duration-300 hover:border-white/20">
        
        {/* HEADER */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide uppercase">
              <FolderLock className="w-3.5 h-3.5" />
              <span>{t('contentCardHeader')}</span>
            </div>
            {isSensitive && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400 text-xs font-medium">
                <ShieldAlert className="w-3 h-3" />
                <span>18+</span>
              </div>
            )}
            {isOnChainActive === true && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <Check className="w-3 h-3" />
                <span>{t('verifiedOnBase')}</span>
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-white capitalize break-words">
            {slug?.toString().replace(/-/g, ' ')}
          </h1>

          {/* BALANCE DISPLAY */}
          {authenticated && activeWallet && (
            <div className="flex items-center inline-flex flex-col justify-center mt-4">
              <span>{t('yourWalletBalance')}</span>
              {isFetchingBalance ? (
                <Loader2 className="inline-block animate-spin text-cyan-400 mt-2" />
              ) : (
                <>
                  <span className="text-3xl font-bold text-white">
                    ${Number(usdcBalance).toFixed(2)} <span className="text-base text-cyan-400 font-semibold">USDC</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-400 mt-0.5">
                    Gas: {Number(ethBalance).toFixed(4)} ETH
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ACTION AREA */}
        <div className="space-y-6">
          {/* BANNED */}
          {isBanned && (
            <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/30 text-center space-y-4 mb-5">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <h2 className="text-white font-bold text-xl">{t('contentRemoved')}</h2>
              <p className="text-red-200">{t('contentRemovedMessage')}</p>
            </div>
          )}

          {/* ON-CHAIN INACTIVE WARNING */}
          {isOnChainActive === false && !loading && !error && !isBanned && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1 text-left">
                <p className="font-semibold text-amber-200">{t('linkInactiveWarning')}</p>
                <p className="text-xs text-amber-300/80 leading-relaxed">{t('linkInactiveDesc')}</p>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-sm text-slate-400 animate-pulse">{t('confirmingPurchase')}</p>
            </div>
          )}

          {/* ERROR STATE */}
          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* 18+ SENSITIVE CONTENT INTERSTITIAL */}
          {!loading && !error && !isBanned && !isOwner && isSensitive && !hasConfirmedAge && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">18+ Content Warning</h3>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  This content is marked 18+. By proceeding, you confirm you are of legal age to view adult or sensitive material in your jurisdiction.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHasConfirmedAge(true)}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20 hover:scale-[1.01]"
              >
                I am an adult and wish to proceed
              </button>
            </div>
          )}

          {/* LOCKED STATE */}
          {!loading && !error && !isBanned && !isOwner && linkData && (!isSensitive || hasConfirmedAge) && (
            <div className="bg-black/30 rounded-2xl p-6 border border-white/5 text-center space-y-4">
              <div className="text-4xl font-bold text-white tracking-tight">
                ${Number(linkData.price_usd).toFixed(2)}
                <span className="text-lg text-cyan-400 font-medium ml-1">USDC</span>
              </div>
              
              {!activeWallet && (
                <p className="text-sm text-slate-400">{t('connectWalletPrompt')}</p>
              )}
              
              {!authenticated ? (
                <button onClick={login} className="w-full py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all cursor-pointer">
                  {t('connectWallet')}
                </button>
              ) : (
                <div className="space-y-3">
                  {wallets.length > 0 && (
                    <div className="relative group">
                      <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-sm font-medium flex items-center justify-between border border-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-cyan-400" />
                          <span>{formatAddress(activeWallet?.address || "")}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
                          {wallets.map((wallet) => (
                            <button
                              key={wallet.address}
                              onClick={() => {
                                setSelectedAddress(wallet.address);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-slate-700 transition-colors ${
                                wallet.address === activeWallet?.address ? "text-cyan-400 font-bold bg-slate-700/50" : "text-slate-300"
                              }`}
                            >
                              <span>{formatAddress(wallet.address)}</span>
                              {wallet.walletClientType === 'privy' && (
                                <span className="text-xs bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50">
                                  {t('embedded')}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SMART FUNDING / CARD / BRIDGE MODAL TRIGGER */}
                  {Number(usdcBalance) < Number(linkData.price_usd) && (
                    <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-left space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-cyan-300 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span>{t('needUsdc')}</span>
                          </p>
                          <p className="text-xs text-slate-300/85 leading-relaxed">
                            {t('needUsdcDesc')}
                          </p>
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-mono text-amber-300">
                          {t('shortBy')} ${(Math.max(0, Number(linkData.price_usd) - Number(usdcBalance))).toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleFundWallet}
                        className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{t('bridgeOrCard')}</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleBuy}
                    disabled={!!txStatus || isOnChainActive === false}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isOnChainActive === false ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-amber-300" />
                        <span>{t('linkInactiveWarning')}</span>
                      </>
                    ) : txStep === "approving" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('stepApproving')}</span>
                      </>
                    ) : txStep === "buying" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('stepPurchasing')}</span>
                      </>
                    ) : txStep === "indexing" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('stepIndexing')}</span>
                      </>
                    ) : txStatus ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="capitalize">{txStatus}</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-5 h-5" />
                        <span>{t('purchaseAndUnlock')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* UNLOCKED STATE */}
          {!loading && !isBanned && (isOwner || isCreator) && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 text-emerald-400">
                <Sparkles className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">
                  {isCreator ? t('creatorAccess') : t('purchaseVerified')}
                </p>
              </div>

              {!decryptedUrl ? (
                <button
                  onClick={handleDecrypt}
                  disabled={!!txStatus}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {txStatus ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{txStatus}</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5" />
                      <span>{t('revealSecret')}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3 bg-black/40 border border-emerald-500/30 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('decryptedPayload')}</p>
                  
                  <div className="flex items-center gap-2 bg-slate-950/80 p-3 rounded-xl border border-white/5 overflow-hidden">
                    <span className="text-sm text-emerald-400 font-mono truncate flex-1 select-all">
                      {decryptedUrl}
                    </span>
                    <button
                      onClick={() => handleCopy(decryptedUrl)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <a
                    href={decryptedUrl.startsWith('http') ? decryptedUrl : `https://${decryptedUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>{t('openLink')}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* CREATOR INFO */}
          {linkData && !loading && !isBanned && (
            <div className="flex items-center justify-between text-xs text-slate-500 px-2">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400/80" />
                {t('createdBy')}
              </span>
              
              <div className="flex items-center gap-1.5">
                <span className="font-mono">{formatAddress(linkData.creator)}</span>
                <button 
                  onClick={() => handleCopy(linkData.creator)}
                  className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-300 cursor-pointer"
                  title={t('copyFullAddress')}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* LOGOUT BUTTON */}
          {authenticated && (
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 border border-white/5 hover:border-red-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('disconnectWallet')}</span>
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="pt-4 border-t border-white/5 flex flex-col items-center justify-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span>{t('securedBy')}</span>
            <span className="font-semibold text-slate-400">Base</span>
            <span>&amp;</span>
            <span className="font-semibold text-slate-400">Lit Protocol</span>
          </div>

          <ReportButton slug={slug} userHasAccess={isOwner || isCreator} />
        </div>
      </div>
    </div>
  );
}
