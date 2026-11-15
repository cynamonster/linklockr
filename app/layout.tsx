import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LinkLockr | Sell Your Links",
  description: "Sell access to encrypted content, powered by Web3.",
  openGraph: {
    title: "LinkLockr | Sell Your Links",
    description: "Sell access to encrypted content, powered by Web3.",
    url: "https://linklockr.xyz",
    siteName: "LinkLockr",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: '/favicon.svg', // Assumes file is in /public/favicon.svg
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://auth.privy.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://auth.privy.io" />
      </head>
      <body
        className={`${geistSans.variable} antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}