import createMiddleware from 'next-intl/middleware';
import {routing} from './routing';
 
// export default createMiddleware({
//   // A list of all locales that are supported
//   locales: ['en', 'es', 'pt'],
 
//   // Used when no locale matches
//   defaultLocale: 'en'
// });

export default createMiddleware(routing);
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};