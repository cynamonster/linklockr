import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
 
// Can be imported from a shared config
const locales = ['en', 'es', 'pt'];
 
export default getRequestConfig(async ({requestLocale}) => {
  // Validate that the incoming `locale` parameter is valid 
  const locale = await requestLocale;
  console.log(`Loading locale: ${locale}`);

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});