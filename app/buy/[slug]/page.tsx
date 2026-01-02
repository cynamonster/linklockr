"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { FolderLock, Unlock, Loader2, AlertCircle, ExternalLink, Check, Shield, Sparkles, Copy, ChevronDown, Wallet } from "lucide-react";

// --- IMPORTS ---
import { supabase } from "../../../utils/supabase";
import { lit } from "../../../utils/lit";
import { checkAndSignAuthMessage } from "@lit-protocol/lit-node-client";
import { LogOut } from "lucide-react";

// --- CONFIG ---
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""; 
// YOUR WALLET ADDRESS (Where the 5% fee goes)
const PLATFORM_FEE_RECIPIENT = process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT; 

const NEXT_PUBLIC_FEE_BPS = process.env.NEXT_PUBLIC_FEE_BPS
  ? parseInt(process.env.NEXT_PUBLIC_FEE_BPS)
  : 500; // Default to 500 bps (5%);

const LINK_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function buyLink(string _slug, address _recipient, address _feeRecipient, uint256 _feeBps) external payable"
];

async function fetchEthPriceUsd() {
  try {
      const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      if (!res.ok) throw new Error("Bad response");
      const data = await res.json();
      return data.ethereum.usd;
  } catch (err) {
      // Fallback to conservative default eth price
      console.warn("Could not fetch real-time ETH price, using fallback.");
      return 3500;
  }
}
const ETH_PRICE = await fetchEthPriceUsd(); 

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
  const { authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // -- WALLETS --
  // Wallet Selection State
  const [selectedAddress, setSelectedAddress] = useState("");

  // Default to first wallet when list loads
  useEffect(() => {
    if (wallets.length > 0 && !selectedAddress) {
        setSelectedAddress(wallets[0].address);
    }
  }, [wallets, selectedAddress]);

  // Disconnect handler: logs out of Privy and clears wallet selection
  const handleDisconnect = async () => {
    try {
      if (logout) await logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
    setSelectedAddress("");
    setIsOwner(false);
  };

  const [ethBalance, setEthBalance] = useState("0.0000");
  const [isFetchingEthBalance, setIsFetchingEthBalance] = useState(false);

  // Fetch native ETH balance for the connected wallet
  useEffect(() => {
    const fetchBalance = async () => {
      setIsFetchingEthBalance(true);

      if (!wallets[0]) return;

      try {
          const address = wallets[0].address;
          const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
          const rawBalance = await provider.getBalance(address);
          const formatted = ethers.formatEther(rawBalance);
          setEthBalance(formatted);
      } catch (err) {
          console.error("Error fetching ETH balance:", err);
      } finally {
          setIsFetchingEthBalance(false);
      }
    };

    fetchBalance();
  }, [wallets]);

  // Helper: Get active wallet object
  const activeWallet = wallets.find(w => w.address === selectedAddress) || wallets[0];

  // Helper: Format Address
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // --  --

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
        await navigator.clipboard.writeText(linkData.creator);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2s
    } catch (err) {
        console.error('Failed to copy!', err);
    }
  };

  // Helper: Check if current user is the Creator
  const isCreator = authenticated && linkData && activeWallet && 
    (linkData.creator.toLowerCase() === activeWallet.address.toLowerCase());

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

  // C. PURCHASE FLOW 
  const handleBuy = async () => {
    // 1. Get the selected wallet (or default to first)
    if (!activeWallet) return login();
    
    setTxStatus("preparing");
    setError("");

    try {
      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const userAddress = await signer.getAddress();

      // --- CHECK 1: GAS (ETH) ---
      // Prevent the "Missing Revert Data" crash by checking ETH first
      const ethBalance = await ethersProvider.getBalance(userAddress);
      const estimatedEthForGas = ethers.parseEther("0.00003");
      const estimatedUsdForGas = (Number(ethers.formatEther(estimatedEthForGas)) * ETH_PRICE).toFixed(2);

      if (ethBalance < estimatedEthForGas) {
        throw new Error(`Insufficient ETH. You need about $${estimatedUsdForGas} of ETH on Base to pay for gas fees.`);
      }

      // --- CHECK 2: MONEY (native ETH) ---
      // Price is stored in the index as `price_eth` (e.g. "0.01") — convert to wei
      // Safe parse: ensure we don't pass a string with >18 decimals to ethers.parseUnits
      const safeParseEther = (value: string | number) => {
        let s = typeof value === 'number' ? String(value) : (value || '0');

        // Handle scientific notation by expanding to fixed decimals
        if (s.includes('e') || s.includes('E')) {
          // Use a reasonably high fixed precision then trim
          s = Number(s).toFixed(20);
        }

        // Normalize and truncate fractional part to <= 18 decimals
        if (s.includes('.')) {
          const [intPart, fracPart] = s.split('.');
          const frac = (fracPart || '').replace(/[^0-9]/g, '');
          const truncated = frac.slice(0, 18);
          s = truncated.length > 0 ? `${intPart}.${truncated}` : intPart;
        }

        return ethers.parseUnits(s, 18);
      };

      // const priceWei = safeParseEther(linkData.price_eth);
      const priceWei = BigInt(linkData.price_wei);

      // Ensure buyer has enough ETH to cover price + gas
      const totalNeeded = priceWei + ethers.parseEther("0.00003");
      if (ethBalance < totalNeeded) {
        throw new Error(`Insufficient ETH. Please ensure you have ETH for the purchase plus gas.`);
      }

      // --- ACTION: BUY ---
      setTxStatus("buying"); // UI: "Purchasing..."
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LINK_ABI, signer);
      
      // Manual gas estimate to catch "Item Paused" or other contract errors cleanly
      try {
        await contract["buyLink(string,address,address,uint256)"].estimateGas(
            slug, 
            userAddress, 
            PLATFORM_FEE_RECIPIENT, 
            NEXT_PUBLIC_FEE_BPS,
            { value: priceWei }
        );
      } catch (err) {
        console.error("Gas estimation failed", err);
        throw new Error("Transaction likely to fail. Is the item still available?");
      }

      const txBuy = await contract.buyLink(
        slug, 
        userAddress, 
        PLATFORM_FEE_RECIPIENT, 
        NEXT_PUBLIC_FEE_BPS,
        { value: priceWei }
      );
      await txBuy.wait();

      // --- SUCCESS ---
      setIsOwner(true);
      setTxStatus("indexing..."); // UI: "Veryfying..."

      // Wait 2s before decrypting to let Lit nodes sync with the blockchain
      await new Promise((resolve) => setTimeout(resolve, 2000)); 

      setTxStatus("");
      handleDecrypt();

    } catch (e: any) {
      console.error(e);
      let msg = e.reason || e.message;
      
      // Translate weird wallet errors into human text
      if (msg.includes("user rejected")) msg = "Transaction cancelled.";
      else if (msg.includes("insufficient funds")) msg = "Insufficient ETH for gas.";
      
      alert(msg);
      setTxStatus("");
    }
  };

  // D. DECRYPT FLOW (Fixed: Strict SIWE Formatting)
  const handleDecrypt = async () => {
    if (!activeWallet) return;
    setTxStatus("decrypting");
    
    try {
      // 1. Get IPFS Content
      const ipfsUrl = `https://ipfs.io/ipfs/${linkData.ipfs_hash}`;
      const response = await fetch(ipfsUrl);
      const encryptedPackage = await response.json();

      // 2. Prepare Signer
      const provider = await activeWallet.getEthereumProvider();
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

      // // 3. Generate AuthSig (The "Official" Way)
      // // This handles SIWE formatting, Chain ID matching, and Expiration automatically.
      // const authSig = await checkAndSignAuthMessage({
      //   chain: "base", // ⚠️ Change to "baseSepolia" if you are on testnet!
      //   signer: signer,
      //   nonce: await lit.getLatestBlockhash(),
      //   // Optional: Force the URI to match where you are hosted
      //   uri: window.location.origin, 
      //   expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), 
      // });

      // 4. Sign
      const signature = await signer.signMessage(siweMessage);

      // const authSig = await checkAndSignAuthMessage({
      //   chain: "base",
   
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

      // const msg = e.message?.includes("NodeInvalidAuthSig") 
      //   ? "Signature Invalid: Please try again." 
      //   : (e.message || "Unknown error");

      let msg = e.message || "Unknown error";
        // Better Error Handling
      if (msg.includes("NodeAccessControlConditionsReturnedNotAuthorized")) {
        msg = "Access Denied. The network thinks you own 0 copies of this item.";
      } else if (msg.includes("NodeInvalidAuthSig")) {
        msg = "Signature Invalid. Please ensure your wallet is on the Base network.";
      }
      
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
            <FolderLock className="text-cyan-400 w-6 h-6" />
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
                        Created by:&nbsp;
                        {linkData?.creator
                          ? `${linkData.creator.slice(0, 6)}...${linkData.creator.slice(-4)}`
                          : "—"}
                      </span>
                      
                      {/* Copy Button */}
                      <button 
                          onClick={handleCopy}
                          className="ml-1 p-1 hover:bg-white/10 rounded-md transition-colors group relative cursor-pointer"
                          title="Copy full address"
                      >
                          {copied ? (
                              <Check size={14} className="text-green-500" />
                          ) : (
                              <Copy size={14} className="text-slate-500 group-hover:text-cyan-400" />
                          )}
                          
                          {/* Optional Tooltip */}
                          {/* {copied && (
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-600 text-[10px] text-white rounded">
                                  Copied!
                              </span>
                          )} */}
                      </button>
                  </div>
              </div>

              {/* NEW: BALANCE DISPLAY */}
              {
                authenticated && activeWallet && (
                  <div className="flex items-center inline-flex flex-col justify-center mt-4">
                      <span>Your wallet balance: </span>
                        {
                          isFetchingEthBalance ? (
                            <Loader2 className="inline-block animate-spin text-cyan-400" />
                          ) : (
                            <>
                              <span className={`text-3xl font-bold text-white`}>
                                ${(Number(ethBalance) * ETH_PRICE).toFixed(2)}
                              </span>
                              <span className="text-sm font-bold text-slate-500 mb-1">
                                ({Number(ethBalance).toFixed(4)} ETH)
                              </span>
                            </>
                          )
                        }
                  </div>
                )
              }
          </div>

            {/* ACTION AREA */}
            <div className="space-y-6">
                
                {/* LOCKED STATE */}
                {!isOwner && (
                    <div className="bg-black/30 rounded-2xl p-6 border border-white/5 text-center space-y-4">
                      <div className="text-4xl font-bold text-white tracking-tight">
                        {`$${Number(linkData.price_usd).toFixed(2)}`}
                        <span className="text-lg text-slate-500 font-medium ml-1">USD</span>
                        <div className="text-sm text-slate-500 mt-1">
                          ( {Number(linkData?.price_eth || 0).toFixed(6)} ETH )
                        </div>
                      </div>
                      {
                        activeWallet ? null : (
                          <p className="text-sm text-slate-400">
                            Connect your wallet to purchase and unlock this content.
                          </p>
                        )
                      }
                      
                      {!authenticated ? (
                          <button onClick={login} className="w-full py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all">
                              Connect Wallet
                          </button>
                      ) : (
                          <div className="space-y-3">
                              {/* WALLET SELECTOR (NEW) */}
                              {wallets.length > 0 && (
                                  <div className="relative group">
                                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                          <Wallet size={14} className="text-slate-500" />
                                      </div>
                                      <select 
                                          value={selectedAddress}
                                          onChange={(e) => setSelectedAddress(e.target.value)}
                                          className="w-full pl-9 pr-8 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 outline-none appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                                      >
                                          {wallets.map((w) => (
                                              <option key={w.address} value={w.address} className="bg-slate-900">
                                                  {formatAddress(w.address)} ({w.walletClientType === 'privy' ? 'Embedded' : w.walletClientType})
                                              </option>
                                          ))}
                                      </select>
                                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                                  </div>
                              )}

                              <button 
                                  onClick={handleBuy} 
                                  disabled={txStatus !== ""}
                                  className="cursor-pointer w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  {txStatus === "buying" && <><Loader2 className="animate-spin" /> Confirming Purchase...</>}
                                  {txStatus === "" && <><Unlock size={20} /> Purchase & Unlock</>}
                              </button>
                          </div>
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

              {/* Disconnect button to allow user to logout / disconnect wallet */}
              {authenticated && (
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleDisconnect}
                    title="Disconnect wallet"
                    className="cursor-pointer mt-2 inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span className="">Disconnect wallet</span>
                  </button>
                </div>
              )}
            
            {/* FOOTER */}
            <div className="mt-2 text-center border-t border-white/5 pt-6">
                <p className="text-xs text-slate-500">
                    Secured by <a href="https://linklockr.xyz" target="_blank" className="text-cyan-400 hover:text-cyan-300">LinkLockr</a>.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}