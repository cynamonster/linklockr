import React from 'react';
import { getTranslations } from 'next-intl/server';

export default async function HowItWorksSection() {
  const t = await getTranslations('CreatePage');

  return (
    <section className="mt-28 text-left space-y-10">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('howItWorksTitle')}
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Decentralized link vending with zero intermediaries. Non-custodial, peer-to-peer settlement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl border transition-all bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-cyan-500/10 text-sky-600 dark:text-cyan-400 flex items-center justify-center font-mono font-bold mb-4">
            01
          </div>
          <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-white">
            {t('howStep1Title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('howStep1Desc')}
          </p>
        </div>

        <div className="p-6 rounded-3xl border transition-all bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-cyan-500/10 text-sky-600 dark:text-cyan-400 flex items-center justify-center font-mono font-bold mb-4">
            02
          </div>
          <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-white">
            {t('howStep2Title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('howStep2Desc')}
          </p>
        </div>

        <div className="p-6 rounded-3xl border transition-all bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-cyan-500/10 text-sky-600 dark:text-cyan-400 flex items-center justify-center font-mono font-bold mb-4">
            03
          </div>
          <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-white">
            {t('howStep3Title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('howStep3Desc')}
          </p>
        </div>

        <div className="p-6 rounded-3xl border transition-all bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-cyan-500/10 text-sky-600 dark:text-cyan-400 flex items-center justify-center font-mono font-bold mb-4">
            04
          </div>
          <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-white">
            {t('howStep4Title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('howStep4Desc')}
          </p>
        </div>
      </div>
    </section>
  );
}
