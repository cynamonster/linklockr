import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { 
  FolderLock, 
  ShieldCheck, 
  Zap, 
  Lock, 
  ArrowRight, 
  DollarSign, 
  CheckCircle2, 
  EyeOff, 
  Sparkles,
  HelpCircle,
  Mail
} from 'lucide-react';
import CreatorCalculator from './CreatorCalculator';
import RotatingHeadline from './RotatingHeadline';
import ScrollToCalculatorButton from './ScrollToCalculatorButton';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'LinkLockr for Creators | Eliminate Chargebacks & Keep 97.5% of Revenue',
    description:
      'The zero-chargeback paywalled link for independent creators, Telegram VIP channels, and private content. 2.5% fee vs 20% on OnlyFans. Instant payouts in USDC on Base.',
    openGraph: {
      title: 'LinkLockr for Creators | 0% Chargebacks. Keep 97.5% of Your Earnings',
      description:
        'Stop losing 20% to platforms and thousands to friendly fraud. Paywall private links, Telegram VIP channels, and custom drops with instant settlement.',
      url: 'https://linklockr.xyz/creators',
      siteName: 'LinkLockr',
      images: [
        {
          url: 'https://linklockr.xyz/api/og',
          width: 1200,
          height: 630,
          alt: 'LinkLockr for Creators',
        },
      ],
      type: 'website',
    },
  };
}

export default async function CreatorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen transition-colors duration-700 font-sans selection:bg-cyan-500/30 overflow-x-hidden bg-gradient-to-br from-slate-900 via-[#0B0C15] to-slate-950 text-slate-100">
      {/* BACKGROUND AMBIENCE */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <FolderLock className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              LinkLockr
            </span>
            <span className="block text-[10px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              For Independent Creators
            </span>
          </div>
        </Link>
      </header>

      {/* HERO SECTION */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 space-y-20">
        <section className="text-center space-y-6 max-w-3xl mx-auto">

          <RotatingHeadline />

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            LinkLockr is a decentralized paywall for independent creators, Telegram VIP channels, and private content sets. Protect custom drops with irreversible checkout and discreet buyer privacy.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <ScrollToCalculatorButton />

            <Link
              href="/?tab=create"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold tracking-wider bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span>Lock Your First Link</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* INTERACTIVE CALCULATOR SECTION */}
        <section id="calculator" className="scroll-mt-16 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Interactive Revenue & Chargeback Calculator
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              See exactly how much revenue you lose to platform cuts, friendly fraud, and dispute fees — and how much you save with LinkLockr.
            </p>
          </div>

          <CreatorCalculator />
        </section>

        {/* 4 CORE VALUE PILLARS */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Built Specifically to Solve Creator Financial Pain
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Why independent creators are diversifying their PPV drops off legacy Web2 platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">0% Chargebacks ("Friendly Fraud" Immune)</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Credit card processors automatically side with buyers who claim &quot;unrecognized transaction&quot;, stripping your earnings and charging you a $15–$25 dispute penalty. LinkLockr payments are cryptographically final. Zero chargebacks, guaranteed.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Instant Wallet Payouts</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Never wait 7–21 days for pending platform deposits or deal with high-risk payment processor &quot;rolling reserves&quot; (where 10% of your earnings are held for 180 days). The second a buyer unlocks your link, USDC hits your self-custodial wallet.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Discreet Buyer Checkout</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Fans frequently abandon purchases because they don&apos;t want explicit website descriptors appearing on joint bank or credit card statements. LinkLockr offers clean, discreet checkout metadata so buyers can unlock content with complete discretion.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Zero Deplatforming or Account Freezes</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                PayPal, Stripe, and CashApp routinely terminate adult accounts with zero warning and freeze balances for 6 months. LinkLockr is built on immutable smart contracts on Base. Your funds go straight to your self-custodial wallet—no middleman can freeze your balance.
              </p>
            </div>
          </div>
        </section>

        {/* 3 STEPS HOW IT WORKS */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Monetize Private Content in 3 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              No merchant application. No KYC paperwork. Up and running in 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="text-base font-bold text-white">Lock Your Private URL</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste any link you want to gate: a private Telegram VIP channel invite, Mega or Google Drive folder, Dropbox gallery, or custom video drop.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="text-base font-bold text-white">Set Your USD Price</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose your price (e.g. $15.00). Pick a memorable link slug or generate a random one. Optionally check the &quot;18+ / Sensitive&quot; toggle for discreet checkout.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="text-base font-bold text-white">Share Anywhere &amp; Get Paid</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Post your link in Twitter/X DMs, Reddit messages, Telegram, or your link-in-bio. Fans unlock with USDC or card, and 97.5% lands directly in your wallet.
              </p>
            </div>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/?tab=create"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-xs font-bold tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Try LinkLockr</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-400">Everything you need to know about payments, safety, and buyer checkout.</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white">Do my buyers need to be crypto experts?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No. Buyers can connect using standard wallets or email via Privy, and can fund their balance directly with Card or Apple Pay in seconds.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white">How does LinkLockr protect me from chargebacks?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Traditional credit cards allow buyers to call their bank months later and claim &quot;fraud&quot;. LinkLockr uses smart contract settlement on Base L2. Cryptographic transactions cannot be reversed by third-party banks, completely eliminating friendly fraud.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white">What is LinkLockr&apos;s fee?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                LinkLockr charges a flat 2.5% convenience fee upon a successful buyer unlock. You keep 97.5% of your earnings, compared to losing up to 20% on other platforms.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white">Where is my content hosted?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                LinkLockr never touches or hosts your raw media files. You keep your content on your own chosen host (Mega, Google Drive, Dropbox, private Telegram VIP links), and LinkLockr acts as an encrypted vending machine that only reveals the URL after verified on-chain payment.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* CREATOR FOOTER */}
      <footer className="border-t border-slate-800/60 bg-slate-950/60 backdrop-blur-md py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FolderLock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white">
                LinkLockr
              </span>
              <span className="text-xs text-slate-500 block">
                Create paywalled links.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-400 text-center sm:text-right">
            <Link
              href="/terms-of-service"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Terms of Service
            </Link>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>Have questions or want help setting up?</span>
            <a
              href="mailto:creators@linklockr.xyz"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/40 text-cyan-400 hover:text-cyan-300 transition-all font-mono font-medium shadow-sm hover:scale-[1.02]"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>creators@linklockr.xyz</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
