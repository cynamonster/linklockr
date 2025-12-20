"use client";

import { useState, useEffect } from "react";
import { 
  Lock, ArrowRight, Loader2, Zap, RefreshCw, 
  Copy, CheckCircle2, Shield, Sparkles, AlertCircle 
} from "lucide-react";
import { PrivyProvider, usePrivy, useLoginWithEmail, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

// --- IMPORTS ---
// Ensure these utility files exist in your project structure
import { lit } from "../utils/lit";
import { uploadToIPFS } from "../utils/ipfs";
import { supabase } from "../utils/supabase";

// --- CONFIGURATION ---
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""; 
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""; 
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base Mainnet USDC

// ABI for the Ownerless Contract
const CONTRACT_ABI = [
  "function createLink(string _slug, uint256 _price, string _ipfsHash) external",
];

const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)"
];

// --- THEME TOGGLE (Aero Style) ---
function ThemeToggle({ isDark, toggle }: { isDark: boolean, toggle: () => void }) {
  return (
    <button 
      onClick={toggle}
      className={`
        p-2 rounded-full transition-all duration-300 border backdrop-blur-md
        ${isDark 
          ? "bg-slate-800/50 border-slate-700 text-cyan-400 hover:bg-slate-800 shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
          : "bg-white/50 border-white/60 text-sky-600 hover:bg-white shadow-sm"
        }
      `}
    >
      {isDark ? <Sparkles size={18} /> : <Zap size={18} />}
    </button>
  );
}

export default function App() {
  // Default to Dark Mode (The "Tactical/Aero" look)
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
            accentColor: isDark ? '#22d3ee' : '#3b82f6', 
            logo: 'https://linklockr.xyz/logo.png'
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
  const { authenticated, user, logout, login, ready } = usePrivy();
  const { loginWithCode, sendCode } = useLoginWithEmail();
  const { wallets } = useWallets();

  // --- STATE ---
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("login");
  
  // Create Form
  const [urlToLock, setUrlToLock] = useState("");
  const [price, setPrice] = useState("");
  const [slug, setSlug] = useState("");
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'wallet'>('create');

  // Auto-generate slug on mount
  useEffect(() => { generateNewSlug(); }, []);

  const generateNewSlug = () => {
    const randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: '-',
      length: 3,
    });
    setSlug(randomName);
  };

  // --- AUTH ACTIONS ---
  const handleLogin = async () => {
    if (!email) return;
    setIsLoading(true);
    try { await sendCode({ email }); setStep("code"); } 
    catch (e: any) { alert("Error: " + e.message); }
    setIsLoading(false);
  };

  const handleVerify = async () => {
    if (!code) return;
    setIsLoading(true);
    try { await loginWithCode({ code }); } 
    catch (e: any) { alert("Error: " + e.message); }
    setIsLoading(false);
  };

  // --- CORE LOGIC: THE "OWNERLESS" PIPELINE ---
  const handleCreateLock = async () => {
    const wallet = wallets[0]; 
    if (!wallet) return alert("Please connect a wallet first.");
    if (!urlToLock || !price || !slug) return alert("Missing fields.");

    setIsLoading(true);
    try {
      // 1. SETUP
      setStatusMsg("1/5 Connecting Wallet...");
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      
      // 2. CHECK AVAILABILITY (via Supabase Indexer first for speed)
      setStatusMsg("2/5 Checking Availability...");
      const { data: existing } = await supabase.from('links').select('slug').eq('slug', slug).single();
      if (existing) throw new Error("Slug already taken! Please click refresh to generate a new one.");

      // 3. CALCULATE ID & ENCRYPT
      // We perform keccak256 on the client to generate the Token ID before it exists
      setStatusMsg("3/5 Encrypting Content...");
      const slugBytes = ethers.toUtf8Bytes(slug);
      const slugHash = ethers.keccak256(ethers.solidityPacked(['bytes'], [slugBytes]));
      const tokenId = BigInt(slugHash).toString(); // uint256 for Lit

      // Lit Protocol Encryption
      // Note: Ensure your lit.encryptLink function accepts (url, tokenId, contractAddress)
      const encryptedData = await lit.encryptLink(urlToLock, tokenId, "base");
      
      // 4. IPFS UPLOAD
      setStatusMsg("4/5 Uploading to IPFS...");
      const ipfsHash = await uploadToIPFS(encryptedData);
      if (!ipfsHash) throw new Error("IPFS Upload Failed");

      // 5. MINT ON CHAIN
      setStatusMsg("5/5 Confirming on Base...");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const priceWei = ethers.parseUnits(price, 6); // USDC 6 decimals

      const tx = await contract.createLink(slug, priceWei, ipfsHash);
      await tx.wait();

      // 6. INDEX FOR DISCOVERY (Supabase)
      await supabase.from('links').insert({
          slug: slug,
          id_hash: slugHash,
          creator: user?.wallet?.address,
          price_usdc: price,
          ipfs_hash: ipfsHash,
          active: true // Default true until reports come in
      });

      setCreatedSlug(slug);
      setStatusMsg("Success!");

      generateNewSlug();

    } catch (e: any) {
      console.error(e);
      // Clean error message
      const msg = e.reason || e.message || "Unknown error";
      alert("Error: " + msg);
    }
    setIsLoading(false);
    setStatusMsg("");
  };

  // --- WITHDRAW LOGIC ---
  const handleWithdraw = async (recipient: string, amount: string) => {
    const wallet = wallets[0];
    if (!wallet) return;
    setIsLoading(true);
    try {
        const provider = await wallet.getEthereumProvider();
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
        
        const amountWei = ethers.parseUnits(amount, 6);
        const tx = await usdcContract.transfer(recipient, amountWei);
        await tx.wait();
        alert(`Sent $${amount}`);
    } catch (e: any) {
        alert(e.message);
    }
    setIsLoading(false);
  };

  if (!ready) return null; // Blink prevention

  // --- VIEW: LOGIN SCREEN ---
  if (!authenticated) {
    return (
       <div className="min-h-screen flex items-center justify-center p-4">
          <div className={`
             max-w-md w-full p-8 transition-all duration-500 rounded-[2rem]
             ${isDark 
               ? "bg-slate-900/60 border-slate-800 shadow-[0_0_40px_rgba(34,211,238,0.1)]" 
               : "bg-white/70 border-white/80 shadow-2xl shadow-blue-900/5"}
             backdrop-blur-2xl border space-y-8
          `}>
              <div className="flex justify-between items-start">
                  <div className="text-left space-y-2">
                    <div className={`
                        inline-flex items-center justify-center w-12 h-12 mb-2 rounded-full transition-all
                        ${isDark 
                          ? "bg-gradient-to-tr from-cyan-900 to-slate-900 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
                          : "bg-gradient-to-tr from-sky-400 to-blue-600 shadow-lg shadow-sky-500/30"}
                    `}>
                        <Lock className={`w-6 h-6 ${isDark ? "text-cyan-400" : "text-white"}`} />
                    </div>
                    <h1 className={`text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                        LinkLockr.
                    </h1>
                    <p className={`text-sm font-medium ${isDark ? "text-cyan-200/50" : "text-slate-500"}`}>
                        Authenticated Vending Protocol
                    </p>
                  </div>
                  <ThemeToggle isDark={isDark} toggle={toggleTheme} />
              </div>

               {step === "login" ? (
                   <div className="space-y-6">
                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Email Access</label>
                            <div className="flex gap-2">
                                <input 
                                    className={`
                                        w-full p-4 outline-none transition-all rounded-2xl border
                                        ${isDark 
                                          ? "bg-black/40 border-slate-800 focus:bg-slate-900/80 focus:ring-cyan-500/50 text-white placeholder:text-slate-600" 
                                          : "bg-white/50 border-transparent focus:bg-white focus:ring-sky-400 text-slate-900"}
                                        focus:ring-2
                                    `}
                                    placeholder="name@example.com" 
                                    onChange={e => setEmail(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                />
                                <button onClick={handleLogin} className={`
                                    p-4 rounded-2xl transition-all border
                                    ${isDark 
                                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" 
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
                                `}>
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={login} 
                            className={`
                                w-full group p-4 font-bold transition-all flex items-center justify-center gap-2 rounded-full
                                ${isDark 
                                  ? "bg-gradient-to-r from-cyan-600 to-blue-700 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] text-white" 
                                  : "bg-gradient-to-r from-sky-400 to-blue-600 hover:shadow-lg hover:shadow-sky-500/20 text-white"}
                                hover:scale-[1.02]
                            `}
                        >
                            <Zap size={18} fill="currentColor" className="text-white/80 group-hover:text-white" />
                            Connect Wallet
                        </button>
                   </div>
               ) : (
                   <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center pb-2">
                            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Code sent to <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{email}</span></p>
                        </div>
                        <input 
                            className={`
                                w-full p-4 border rounded-2xl text-center text-3xl tracking-[1em] font-mono outline-none focus:ring-2
                                ${isDark ? "bg-black/40 border-slate-800 text-white focus:ring-cyan-500/50" : "bg-white/50 border-transparent text-slate-900 focus:ring-sky-400"}
                            `}
                            placeholder="000000" 
                            maxLength={6}
                            onChange={e => setCode(e.target.value)} 
                        />
                        <button onClick={handleVerify} disabled={isLoading} className={`
                            w-full p-4 rounded-2xl font-bold transition-all
                            ${isDark ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-900 text-white hover:bg-slate-800"}
                        `}>
                            {isLoading ? <Loader2 className="animate-spin mx-auto"/> : "Verify Access"}
                        </button>
                   </div>
               )}
          </div>
       </div>
    )
  }

  // --- VIEW: SUCCESS SCREEN ---
  if (createdSlug) {
      const shareUrl = `${window.location.origin}/buy/${createdSlug}`;
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className={`
                max-w-md w-full p-8 rounded-[2rem] border text-center space-y-6 backdrop-blur-xl shadow-2xl
                ${isDark ? "bg-slate-900/60 border-slate-700 shadow-black/50" : "bg-white/80 border-white shadow-blue-900/5"}
            `}>
                <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
                    ${isDark ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-600"}
                `}>
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Link Initialized!</h2>
                <p className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Your content is encrypted on IPFS and the slug is registered on Base.
                </p>
                
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-2 ${isDark ? "bg-black/30 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <code className={`text-sm font-mono truncate ${isDark ? "text-cyan-400" : "text-blue-600"}`}>{shareUrl}</code>
                    <button onClick={() => navigator.clipboard.writeText(shareUrl)} className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-white text-slate-500"}`}>
                        <Copy size={16} />
                    </button>
                </div>
                
                <button onClick={() => {
                  setCreatedSlug(null);
                  generateNewSlug();
                 }} className={`w-full py-3 font-medium ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
                    Create Another
                </button>
            </div>
        </div>
      )
  }

  // --- VIEW: DASHBOARD ---
  return (
    <div className="max-w-2xl mx-auto pt-12 px-6 pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
           <div className={`
              p-2 rounded-xl border
              ${isDark 
                ? "bg-slate-900/50 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]" 
                : "bg-gradient-to-tr from-sky-400 to-blue-600 border-transparent shadow-lg shadow-blue-500/20"}
           `}>
               <Lock className={`w-5 h-5 ${isDark ? "text-cyan-400" : "text-white"}`} />
           </div>
           <span className={`font-bold text-xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>LinkLockr</span>
        </div>
        <div className="flex gap-4 items-center">
            <ThemeToggle isDark={isDark} toggle={toggleTheme} />
            <button onClick={logout} className={`text-sm font-medium hover:text-opacity-100 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-600"}`}>Logout</button>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className={`
          p-8 transition-all duration-500 rounded-[2.5rem]
          ${isDark 
            ? "bg-slate-900/40 border-white/5 shadow-2xl shadow-black/50" 
            : "bg-white/70 border-white/80 shadow-xl shadow-blue-900/5"}
          backdrop-blur-xl border
      `}>
        
        {/* TAB SWITCHER */}
        <div className={`flex gap-2 mb-8 p-1.5 rounded-full w-fit border ${isDark ? "bg-black/40 border-slate-800" : "bg-slate-100/50 border-transparent"}`}>
            {['create', 'wallet'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`
                        px-6 py-2 rounded-full text-sm font-bold transition-all uppercase tracking-wide
                        ${activeTab === tab 
                            ? (isDark ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700' : 'bg-white text-slate-900 shadow-sm') 
                            : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
                        }
                    `}
                >
                    {tab}
                </button>
            ))}
        </div>

        {activeTab === 'create' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                {/* 1. SLUG INPUT */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center ml-1">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Link Slug</label>
                        <span className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>Immutable ID</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <span className={`absolute left-4 top-4 font-mono select-none ${isDark ? "text-slate-600" : "text-slate-400"}`}>/</span>
                            <input 
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                type="text" 
                                className={`
                                    w-full p-4 pl-8 outline-none transition-all font-mono rounded-2xl border
                                    ${isDark 
                                      ? "bg-black/40 border-slate-800 text-cyan-400 focus:border-cyan-500/50 focus:bg-slate-900/60" 
                                      : "bg-white/50 border-transparent text-blue-600 focus:bg-white focus:ring-2 focus:ring-sky-400"}
                                `}
                            />
                        </div>
                        <button 
                            onClick={generateNewSlug}
                            className={`
                                p-4 rounded-2xl transition-all border
                                ${isDark 
                                  ? "bg-slate-800/50 border-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-800" 
                                  : "bg-white/50 border-transparent text-slate-400 hover:text-sky-500 hover:bg-white"}
                            `}
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* 2. PRICE INPUT */}
                <div className="space-y-3">
                    <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Price (USDC)</label>
                    <div className="relative">
                        <span className={`absolute left-4 top-4 font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}>$</span>
                        <input 
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            type="number" 
                            placeholder="5.00" 
                            className={`
                                w-full p-4 pl-8 outline-none transition-all font-bold text-xl rounded-2xl border
                                ${isDark 
                                  ? "bg-black/40 border-slate-800 text-white placeholder:text-slate-700 focus:border-cyan-500/50 focus:bg-slate-900/60" 
                                  : "bg-white/50 border-transparent text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-sky-400"}
                            `}
                        />
                    </div>
                </div>

                {/* 3. URL INPUT */}
                <div className="space-y-3">
                    <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Content URL</label>
                    <div className="relative">
                        <Shield className={`absolute left-4 top-4 w-5 h-5 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
                        <input 
                            value={urlToLock}
                            onChange={(e) => setUrlToLock(e.target.value)}
                            type="url" 
                            placeholder="https://..." 
                            className={`
                                w-full p-4 pl-12 outline-none transition-all rounded-2xl border
                                ${isDark 
                                  ? "bg-black/40 border-slate-800 text-slate-300 placeholder:text-slate-700 focus:border-cyan-500/50 focus:bg-slate-900/60" 
                                  : "bg-white/50 border-transparent text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-sky-400"}
                            `}
                        />
                    </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button 
                  onClick={handleCreateLock}
                  disabled={isLoading}
                  className={`
                      w-full font-bold py-5 transition-all flex items-center justify-center gap-2 rounded-full
                      ${isDark 
                        ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-[1.01]" 
                        : "bg-gradient-to-r from-sky-400 to-blue-600 text-white hover:shadow-lg hover:shadow-sky-500/30 hover:scale-[1.01]"}
                      disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isLoading ? (
                    <><Loader2 className="animate-spin" /> {statusMsg || "PROCESSING..."}</>
                  ) : (
                    <><Zap size={20} fill="currentColor" className="text-white/80" /> ENCRYPT LINK</>
                  )}
                </button>
                
                {/* TERMS CHECKBOX */}
                <div className="flex items-start gap-2 pt-2">
                    <input type="checkbox" className="mt-1" />
                    <p className={`text-[10px] leading-tight ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                        By creating this link, you agree that you have the right to sell this content and indemnify LinkLockr from any liability. Content with 3+ reports is automatically delisted.
                    </p>
                </div>
            </div>
        ) : (
            /* WALLET TAB */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                <div className={`p-6 rounded-3xl relative overflow-hidden border ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-900 border-transparent"}`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl ${isDark ? "bg-cyan-500/20" : "bg-blue-500/20"}`}></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Active Wallet</p>
                        <p className={`font-mono text-lg truncate opacity-90 ${isDark ? "text-cyan-400" : "text-blue-200"}`}>{user?.wallet?.address}</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                     <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Withdraw Funds</h3>
                     <div className="grid grid-cols-3 gap-3">
                        <input id="wAddr" placeholder="0x..." className={`col-span-2 p-3 border rounded-xl text-sm outline-none ${isDark ? "bg-black/40 border-slate-800 text-white" : "bg-white border-slate-200"}`} />
                        <input id="wAmt" placeholder="$$" className={`p-3 border rounded-xl text-sm outline-none ${isDark ? "bg-black/40 border-slate-800 text-white" : "bg-white border-slate-200"}`} />
                     </div>
                     <button 
                        onClick={() => handleWithdraw(
                            (document.getElementById("wAddr") as HTMLInputElement).value,
                            (document.getElementById("wAmt") as HTMLInputElement).value
                        )}
                        className={`w-full py-3 font-bold rounded-xl transition-all ${isDark ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                     >
                        Send USDC
                     </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}