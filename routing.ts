import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'es', 'pt'], // import from shared config?
  defaultLocale: 'en',
  
  pathnames: {
    '/': '/',
    // External localized URLs point to internal folder /buy/[slug]
    '/buy/[slug]': {
      en: '/buy/[slug]',
      es: '/comprar/[slug]',
      pt: '/comprar/[slug]'
    }
  }
});

// Use these exports everywhere in your app instead of 'next/link'
export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);