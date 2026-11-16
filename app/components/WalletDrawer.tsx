'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Loader2, LogOut, Wallet, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWeb3 } from './Web3Context';

export default function WalletDrawer() {
  const t = useTranslations('CreatePage');
  const {
    isWalletDrawerOpen,
    setIsWalletDrawerOpen,
    wallets,
    selectedAddress,
    setSelectedAddress,
    activeWallet,
    logout,
    formatAddress,
  } = useWeb3();

  const [withdrawForm, setWithdrawForm] = useState({ address: '', amount: '' });
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsWalletDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setIsWalletDrawerOpen]);

  const handleWithdraw = async () => {
    if (!activeWallet || !withdrawForm.address || !withdrawForm.amount) return;
    setIsWithdrawing(true);
    try {
      const { ensureBaseChain } = await import('../../utils/chainGuard');
      await ensureBaseChain(activeWallet);
      const { ethers } = await import('ethers');
      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const tx = await signer.sendTransaction({
        to: withdrawForm.address,
        value: ethers.parseEther(withdrawForm.amount),
      });
      await tx.wait();
      alert(`Sent ${withdrawForm.amount} ETH`);
      setWithdrawForm({ address: '', amount: '' });
    } catch (e: any) {
      alert(e.message || String(e));
    }
    setIsWithdrawing(false);
  };

  if (!isWalletDrawerOpen) return null;

  return (
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
                  <option
                    key={w.address}
                    value={w.address}
                    className="bg-slate-900 text-slate-200 font-sans"
                  >
                    {formatAddress(w.address)} (
                    {w.walletClientType === 'privy'
                      ? t('embedded')
                      : w.walletClientType}
                    )
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                size={16}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              {activeWallet?.walletClientType === 'privy'
                ? t('embeddedWallet')
                : t('externalWallet')}
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
                onChange={(e) =>
                  setWithdrawForm({ ...withdrawForm, address: e.target.value })
                }
                placeholder="0x Destination address..."
                className="w-full p-3 rounded-xl bg-black/40 border border-slate-800 text-sm font-mono text-white placeholder:text-slate-600 outline-none focus:border-cyan-500"
              />
              <input
                value={withdrawForm.amount}
                onChange={(e) =>
                  setWithdrawForm({ ...withdrawForm, amount: e.target.value })
                }
                placeholder="Amount (ETH)"
                type="number"
                step="0.001"
                className="w-full p-3 rounded-xl bg-black/40 border border-slate-800 text-sm font-mono text-white placeholder:text-slate-600 outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleWithdraw}
              disabled={
                isWithdrawing || !withdrawForm.address || !withdrawForm.amount
              }
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isWithdrawing ? (
                <Loader2 className="animate-spin mx-auto" size={16} />
              ) : (
                t('sendEth')
              )}
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
  );
}
