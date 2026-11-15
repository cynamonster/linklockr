import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://linklockr.xyz"),
  title: "LinkLockr | Create Paywalled Links",
  description: "Sell access to content with instant settlement in USDC on the Base network. Zero chargebacks. Gas fees less than one penny. Decentralized encryption on Lit Protocol TEEs.",
  openGraph: {
    title: "LinkLockr | Create Paywalled Links",
    description: "Sell access to content with instant settlement in USDC on Base. Zero chargebacks. Sub-cent gas fees. Decentralized encryption on Lit Protocol TEEs.",
    url: "https://linklockr.xyz",
    siteName: "LinkLockr",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "LinkLockr - Create Paywalled Links on Base",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkLockr | Create Paywalled Links",
    description: "Sell access to content with instant settlement in USDC on Base. Zero chargebacks. Gas fees less than one penny. Decentralized encryption on Lit Protocol TEEs.",
    images: ["/api/og"],
    creator: "@LinkLockr",
    site: "@LinkLockr",
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://linklockr.xyz/api/og",
    "fc:frame:button:1": "Lock a Link on Base",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://linklockr.xyz",
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://auth.privy.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://auth.privy.io" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=window.matchMedia('(prefers-color-scheme: light)').matches;if(m){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} bg-slate-950 text-slate-50 antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}