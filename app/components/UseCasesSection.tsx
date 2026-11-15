import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Sparkles, FolderLock, Shield } from 'lucide-react';

export default async function UseCasesSection() {
  const t = await getTranslations('CreatePage');

  return (
    <section className="mt-28 text-left space-y-10">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('useCasesTitle')}
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Any piece of high-value information or link can be instantly monetized.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-7 rounded-3xl border transition-all bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Sparkles size={20} />
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
            {t('useCase1Title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('useCase1Desc')}
          </p>
        </div>

        <div className="p-7 rounded-3xl border transition-all bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-cyan-500/10 text-sky-600 dark:text-cyan-400 flex items-center justify-center mb-4">
            <FolderLock size={20} />
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
            {t('useCase2Title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('useCase2Desc')}
          </p>
        </div>

        <div className="p-7 rounded-3xl border transition-all bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <Shield size={20} />
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
            {t('useCase3Title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('useCase3Desc')}
          </p>
        </div>
      </div>
    </section>
  );
}
