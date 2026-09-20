// import {notFound} from 'next/navigation';
// import {getRequestConfig} from 'next-intl/server';
 
// export default getRequestConfig(async ({requestLocale}) => {
//   // Validate that the incoming `locale` parameter is valid 
//   const locale = await requestLocale;
//   console.log(`Loading locale: ${locale}`);

//   return {
//     locale,
//     messages: (await import(`./messages/${locale}.json`)).default
//   };
// });

import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing'; // or '@/i18n/routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Resolve the requested locale
  const requested = await requestLocale;

  // 2. Validate against supported locales (e.g., ['en', 'es', 'pt'])
  if (!requested || !routing.locales.includes(requested as any)) {
    notFound();
  }

  const locale = requested;

  // 3. Load messages safely
  return {
    locale,
    // Note: ensure the relative path points correctly to your messages directory
    messages: (await import(`../messages/${locale}.json`)).default
  };
});