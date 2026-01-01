import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
