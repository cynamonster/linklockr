// components/LanguageSwitcher.tsx
'use client';

import { usePathname, useRouter } from '@/routing';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    router.replace(
      // @ts-ignore
      { pathname, params },
      { locale: newLocale }
    );
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="flex items-center gap-1.5 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 transition-all text-xs">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>

        <select
          value={locale}
          onChange={handleLanguageChange}
          className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer appearance-none pr-1"
          aria-label="Select Language"
        >
          <option value="en" className="bg-slate-900 text-slate-100">EN</option>
          <option value="es" className="bg-slate-900 text-slate-100">ES</option>
          <option value="pt" className="bg-slate-900 text-slate-100">PT</option>
          <option value="zh" className="bg-slate-900 text-slate-100">中文</option>
        </select>

        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}