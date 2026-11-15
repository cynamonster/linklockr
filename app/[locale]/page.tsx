import React from 'react';
import { setRequestLocale } from 'next-intl/server';
import { FolderLock } from 'lucide-react';

import { Web3Provider } from '../components/Web3Context';
import HeaderWalletButton from '../components/HeaderWalletButton';
import WalletDrawer from '../components/WalletDrawer';
import CreationCard from '../components/CreationCard';
import HeroSection from '../components/HeroSection';
import HowItWorksSection from '../components/HowItWorksSection';
import UseCasesSection from '../components/UseCasesSection';
import FooterSection from '../components/FooterSection';
import { generateSlugAction } from '../actions/slug';

const NEXT_PUBLIC_FEE_BPS = process.env.NEXT_PUBLIC_FEE_BPS
  ? parseInt(process.env.NEXT_PUBLIC_FEE_BPS)
  : 250; // Default to 250 bps (2.5%);
const percentFeeBps = NEXT_PUBLIC_FEE_BPS / 100;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Generate initial slug on the server during SSR (zero client dictionary load!)
  let initialSlug = 'secure-paid-content';
  try {
    initialSlug = await generateSlugAction();
  } catch (e) {
    console.error('Error generating server slug:', e);
  }

  return (
    <Web3Provider>
      {/* MASTER WRAPPER */}
      <div className="min-h-screen transition-colors duration-700 font-sans selection:bg-cyan-500/30 overflow-x-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 text-slate-900 dark:bg-none dark:bg-[#0B0C15] dark:text-slate-200">
        {/* LIGHT MODE: SKY AURORA */}
        <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sky-300/30 rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 opacity-100 dark:opacity-0" />

        {/* DARK MODE: NEBULA GLOW */}
        <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none transition-opacity duration-700 opacity-0 dark:opacity-100" />
        <div className="fixed top-[10%] left-[20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 opacity-0 dark:opacity-100" />

        <div className="relative min-h-screen overflow-x-hidden">
          {/* TOP NAVIGATION BAR */}
          <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between gap-2">
            {/* BRAND LOGO (Pure Server-Rendered HTML) */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="p-2.5 rounded-2xl border transition-all bg-gradient-to-tr from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/20 dark:bg-none dark:bg-slate-900/60 dark:border-cyan-500/30 dark:text-cyan-400 dark:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <FolderLock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  LinkLockr
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="text-[10px] font-mono tracking-wider text-cyan-600 dark:text-cyan-400 uppercase font-semibold">
                    Base • USDC
                  </span>
                </div>
              </div>
            </div>

            {/* WALLET BUTTON (Lightweight Client Component) */}
            <HeaderWalletButton />
          </header>

          {/* HERO & IN-PLACE CREATION CONTAINER */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* LEFT: VALUE PROPOSITION (Pure Server-Rendered HTML) */}
              <HeroSection />

              {/* RIGHT: IN-PLACE CREATION CARD (Client Component) */}
              <div className="lg:col-span-5">
                <CreationCard
                  initialSlug={initialSlug}
                  percentFeeBps={percentFeeBps}
                />
              </div>
            </div>

            {/* SECTION: HOW IT WORKS (Pure Server-Rendered HTML) */}
            <HowItWorksSection />

            {/* SECTION: USE CASES (Pure Server-Rendered HTML) */}
            <UseCasesSection />

            {/* FOOTER (Pure Server-Rendered HTML with Language Switcher) */}
            <FooterSection />
          </main>

          {/* WALLET SLIDEOVER DRAWER (Client Component, loads lazy) */}
          <WalletDrawer />
        </div>
      </div>
    </Web3Provider>
  );
}
