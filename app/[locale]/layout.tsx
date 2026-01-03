import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Define the supported locales
const locales = ['en', 'es', 'pt'];

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // 1. Unwrap the params promise (Essential for Next.js 15)
  const { locale } = await params;

  // 2. Validate the locale
  if (!locales.includes(locale)) {
    notFound();
  }

  // 3. Enable static rendering for this locale
  setRequestLocale(locale);

  // 4. Load messages for the provider
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Optional: Generates static paths for each language at build time
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}