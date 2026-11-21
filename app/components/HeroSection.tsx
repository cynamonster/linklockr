import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Sparkles, Shield, Zap, Lock } from 'lucide-react';

export default async function HeroSection() {
  const t = await getTranslations('CreatePage');

  return (
    <div className="lg:col-span-7 space-y-6 text-left">
      
      <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white">
        {t('heroTitle')}
      </h1>

      <p className="text-base sm:text-xl font-normal leading-relaxed text-slate-700 dark:text-slate-300">
        {t('heroSubtitle')}
      </p>

      {/* TRUST PILL BADGES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-4 rounded-2xl border transition-all bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <Shield className="w-5 h-5 text-sky-600 dark:text-cyan-400 mb-1.5" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Lit Protocol TEE
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted client/server condition
          </p>
        </div>

        <div className="p-4 rounded-2xl border transition-all bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <Zap className="w-5 h-5 text-sky-600 dark:text-cyan-400 mb-1.5" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Sub-Cent Gas
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Base L2 sub-penny mint & buy
          </p>
        </div>

        <div className="p-4 rounded-2xl border transition-all bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <Lock className="w-5 h-5 text-sky-600 dark:text-cyan-400 mb-1.5" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Zero Chargebacks
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant non-reversible USDC
          </p>
        </div>
      </div>
    </div>
  );
}
