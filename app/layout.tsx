import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-slate-50 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}