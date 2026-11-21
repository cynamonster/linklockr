import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'es', 'pt', 'zh'], // import from shared config?
  defaultLocale: 'en',
  localePrefix: 'never',
  
  pathnames: {
    '/': '/',
    '/buy/[slug]': '/buy/[slug]',
    '/creators': '/creators'
  }
});

// Use these exports everywhere in your app instead of 'next/link'
export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);