"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { Lock, Unlock, Loader2, AlertCircle, ExternalLink, Check, Shield, Sparkles, Copy } from "lucide-react";

// --- IMPORTS ---
import { supabase } from "../../../utils/supabase";
import { lit } from "../../../utils/lit";

// --- CONFIG ---
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""; 
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base Mainnet USDC

// YOUR WALLET ADDRESS (Where the 5% fee goes)
const PLATFORM_FEE_RECIPIENT = process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT; 

const LINK_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function buyLink(string _slug, address _recipient, address _feeRecipient, uint256 _feeBps) external"
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// --- 1. THE WRAPPER (Fixes the "Uncaught Error") ---
export default function BuyPage() {
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
          // fundingMethodConfig: {
          //   moonpay: {
          //     useSandbox: true, // Set to false for production
          //   },
          //   // You can also add coinbase: {} or other methods here
          // },
          defaultChain: {
            id: 8453,
            name: 'Base',
            network: 'base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: ['https://mainnet.base.org'] } }
          }
        }}
      >
        <BuyPageContent />
      </PrivyProvider>
    );
}

// --- 2. THE CONTENT (Logic) ---
function BuyPageContent() {
  const { slug } = useParams();
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  // Data State
  const [linkData, setLinkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Transaction State
  const [isOwner, setIsOwner] = useState(false);
  const [txStatus, setTxStatus] = useState(""); 
  const [decryptedContent, setDecryptedContent] = useState("");

  // Copy full wallet address
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
        // await navigator.clipboard.writeText(linkData.creator);
        await navigator.clipboard.writeText(wallets[0].address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2s
    } catch (err) {
        console.error('Failed to copy!', err);
    }
  };

  // Helper: Check if current user is the Creator
  const isCreator = authenticated && linkData && wallets[0] && 
    (linkData.creator.toLowerCase() === wallets[0].address.toLowerCase());

  useEffect(() => {
    if (slug) fetchLinkData();
  }, [slug]);

  useEffect(() => {
    if (authenticated && wallets.length > 0 && linkData) {
      checkOwnership();
    }
  }, [authenticated, wallets, linkData]);

  // A. FETCH METADATA
  const fetchLinkData = async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) throw new Error("Link not found or has been removed.");
      if (!data.active) throw new Error("This link has been suspended due to reports.");
      
      setLinkData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // B. CHECK OWNERSHIP
  const checkOwnership = async () => {
    try {
      const provider = await wallets[0].getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LINK_ABI, ethersProvider);
      
      const slugBytes = ethers.toUtf8Bytes(slug as string);
      const slugHash = ethers.keccak256(ethers.solidityPacked(['bytes'], [slugBytes]));
      const tokenId = BigInt(slugHash).toString();

      const balance = await contract.balanceOf(wallets[0].address, tokenId);
      if (balance > BigInt(0)) setIsOwner(true);
    } catch (e) {
      console.error("Ownership check failed", e);
    }
  };

  // C. PURCHASE FLOW
  const handleBuy = async () => {
    if (!wallets[0]) return login();
    setTxStatus("preparing");

    try {
      const provider = await wallets[0].getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      // Approve USDC
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const priceWei = ethers.parseUnits(linkData.price_usdc.toString(), 6);
      
      setTxStatus("approving");
      const allowance = await usdcContract.allowance(wallets[0].address, CONTRACT_ADDRESS);
      if (allowance < priceWei) {
        const txApprove = await usdcContract.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
        await txApprove.wait();
      }

      // Execute Buy
      setTxStatus("buying");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LINK_ABI, signer);
      
      const txBuy = await contract.buyLink(
        slug, 
        wallets[0].address, 
        PLATFORM_FEE_RECIPIENT, 
        500 
      );
      await txBuy.wait();

      setIsOwner(true);
      setTxStatus("");
      handleDecrypt();

    } catch (e: any) {
      console.error(e);
      alert("Transaction Failed: " + (e.reason || e.message));
      setTxStatus("");
    }
  };

  // D. DECRYPT FLOW (Fixed: Strict SIWE Formatting)
  const handleDecrypt = async () => {
    if (!wallets[0]) return;
    setTxStatus("decrypting");
    
    try {
      // 1. Get IPFS Content
      const ipfsUrl = `https://ipfs.io/ipfs/${linkData.ipfs_hash}`;
      const response = await fetch(ipfsUrl);
      const encryptedPackage = await response.json();

      // 2. Prepare Signer
      const provider = await wallets[0].getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      // 3. Generate Strict SIWE Message
      const latestBlockhash = await lit.getLatestBlockhash();
      const domain = window.location.host;
      const origin = window.location.origin;
      const rawAddress = await signer.getAddress();
      
      // CRITICAL: Force Checksum Address (e.g. 0xAbC... not 0xabc...)
      const address = ethers.getAddress(rawAddress); 
      
      const statement = "Sign this message to prove you own the wallet to access this content.";
      const issuedAt = new Date().toISOString();
      const expirationTime = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

      // CRITICAL: DO NOT INDENT THIS STRING. IT MUST BE FLUSH LEFT.
const siweMessage = `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${origin}
Version: 1
Chain ID: 8453
Nonce: ${latestBlockhash}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;

      // 4. Sign
      const signature = await signer.signMessage(siweMessage);

      const authSig = {
        sig: signature,
        derivedVia: "web3.eth.personal.sign",
        signedMessage: siweMessage,
        address: address,
      };

      // 5. Decrypt
      const decryptedString = await lit.decryptLink(
        encryptedPackage.ciphertext,
        encryptedPackage.dataToEncryptHash,
        encryptedPackage.accessControlConditions,
        authSig 
      );

      setDecryptedContent(decryptedString);

    } catch (e: any) {
      console.error(e);
      // Clean up the error message for the UI
      const msg = e.message?.includes("NodeInvalidAuthSig") 
        ? "Signature Invalid: Please try again." 
        : (e.message || "Unknown error");
      alert("Decryption Failed: " + msg);
    }
    setTxStatus("");
  };

  // --- RENDER ---
  if (loading) return (
    <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center">
      <Loader2 className="animate-spin text-cyan-400" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl text-center max-w-md">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Unavailable</h2>
            <p className="text-red-200">{error}</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0C15] text-slate-200 font-sans selection:bg-cyan-500/30 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* HEADER */}
        <div className="flex justify-center mb-8">
            <div className="bg-slate-900/50 border border-cyan-500/30 p-3 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Lock className="text-cyan-400 w-6 h-6" />
            </div>
        </div>

        {/* MAIN CARD */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/50">
            
            {/* CONTENT HEADER */}
            <div className="text-center space-y-2 mb-8">
              <p className="text-cyan-500 font-mono text-xs uppercase tracking-widest">Secure Content</p>
              <h1 className="text-2xl font-bold text-white break-words">{slug}</h1>
              
              <div className="flex flex-col items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-slate-400 font-mono">
                          {
                            wallets[0] 
                              ? wallets[0].address.slice(0, 6)
                              : linkData.creator.slice(0, 6)
                          }
                          ...
                          {
                            wallets[0]
                              ? wallets[0].address.slice(-4)
                              : linkData.creator.slice(-4)
                          }
                      </span>
                      
                      {/* Copy Button */}
                      <button 
                          onClick={handleCopy}
                          className="ml-1 p-1 hover:bg-white/10 rounded-md transition-colors group relative"
                          title="Copy full address"
                      >
                          {copied ? (
                              <Check size={14} className="text-green-500" />
                          ) : (
                              <Copy size={14} className="text-slate-500 group-hover:text-cyan-400" />
                          )}
                          
                          {/* Optional Tooltip */}
                          {copied && (
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-600 text-[10px] text-white rounded">
                                  Copied!
                              </span>
                          )}
                      </button>
                  </div>
              </div>
          </div>

            {/* ACTION AREA */}
            <div className="space-y-6">
                
                {/* LOCKED STATE */}
                {!isOwner && (
                    <div className="bg-black/30 rounded-2xl p-6 border border-white/5 text-center space-y-4">
                        <div className="text-4xl font-bold text-white tracking-tight">
                            ${linkData.price_usdc}
                            <span className="text-lg text-slate-500 font-medium ml-1">USDC</span>
                        </div>
                        <p className="text-sm text-slate-400">Unlock this content permanently on the blockchain.</p>
                        
                        {!authenticated ? (
                            <button onClick={login} className="w-full py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all">
                                Connect Wallet
                            </button>
                        ) : (
                            <button 
                                onClick={handleBuy} 
                                disabled={txStatus !== ""}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                {txStatus === "approving" && <><Loader2 className="animate-spin" /> Approving USDC...</>}
                                {txStatus === "buying" && <><Loader2 className="animate-spin" /> Confirming Purchase...</>}
                                {txStatus === "" && <><Unlock size={20} /> Purchase & Unlock</>}
                            </button>
                        )}
                    </div>
                )}

                {/* UNLOCKED STATE */}
                {isOwner && !decryptedContent && (
                    <div className="text-center space-y-4">
                        {/* THE "WHY" BADGE */}
                        {isCreator ? (
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center gap-2 text-indigo-400">
                                <Sparkles size={20} />
                                <span className="font-bold">Creator Access</span>
                            </div>
                        ) : (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center gap-2 text-green-400">
                                <Check size={20} />
                                <span className="font-bold">Purchase Verified</span>
                            </div>
                        )}

                        <button 
                             onClick={handleDecrypt}
                             disabled={txStatus !== ""}
                             className="w-full py-4 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            {txStatus === "decrypting" ? <Loader2 className="animate-spin" /> : <Shield size={18} />}
                            Reveal Secret Data
                        </button>
                    </div>
                )}

                {/* REVEALED CONTENT */}
                {decryptedContent && (
                    <div className="animate-in zoom-in-95 duration-300">
                        <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-6 relative group">
                            <h3 className="text-cyan-500 text-xs font-bold uppercase mb-2">Decrypted Payload</h3>
                            <div className="bg-black/50 p-4 rounded-xl border border-black text-white font-mono text-sm break-all">
                                {decryptedContent}
                            </div>
                            
                            {decryptedContent.startsWith('http') && (
                                <a 
                                    href={decryptedContent} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all"
                                >
                                    <ExternalLink size={18} />
                                    Open Link
                                </a>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* FOOTER */}
            <div className="mt-8 text-center border-t border-white/5 pt-6">
                <p className="text-xs text-slate-500">
                    Secured by LinkLockr. Content is immutable.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}