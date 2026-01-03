// components/LanguageSwitcher.tsx
'use client';

import { usePathname, useRouter } from '@/routing';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
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
    <div className="relative group">
      {/* Mobile UX Tip: The native <select> is actually the best "Mobile Friendly" component.
          It triggers the phone's native picker (iOS Wheel / Android List), 
          which is much easier to use than a custom tiny dropdown.
      */}
      <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5 hover:border-indigo-500 transition-colors">
        
        {/* Globe Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>

        <select
          value={locale}
          onChange={handleLanguageChange}
          className="bg-transparent text-sm font-medium text-slate-200 outline-none cursor-pointer appearance-none pr-1"
          aria-label="Select Language"
        >
          <option value="en" className="bg-slate-900">English (EN)</option>
          <option value="es" className="bg-slate-900">Español (ES)</option>
          <option value="pt" className="bg-slate-900">Português (PT)</option>
        </select>

        {/* Down Arrow for Visual Cue */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}