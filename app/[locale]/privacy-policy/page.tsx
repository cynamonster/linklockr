import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import {
  FolderLock,
  ShieldCheck,
  Lock,
  Database,
  EyeOff,
  Globe,
  Server,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ArrowLeft,
  ExternalLink,
  Key,
  Cpu,
  Cookie,
  UserCheck
} from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Privacy Policy | LinkLockr',
    description:
      'Privacy Policy for LinkLockr. Understand how our decentralized, non-custodial paywall on Base handles on-chain transactions, encryption, and user data privacy.',
    openGraph: {
      title: 'Privacy Policy | LinkLockr',
      description:
        'Privacy Policy for LinkLockr. Decentralized, non-custodial link monetization with end-to-end Lit Protocol encryption and zero ad tracking.',
      url: 'https://linklockr.xyz/privacy-policy',
      siteName: 'LinkLockr',
      images: [
        {
          url: 'https://linklockr.xyz/api/og',
          width: 1200,
          height: 630,
          alt: 'LinkLockr Privacy Policy',
        },
      ],
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' },
    { locale: 'pt' },
    { locale: 'zh' },
  ];
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const lastUpdated = 'November 26, 2026';

  const sections = [
    { id: 'overview', title: '1. Overview & Core Philosophy' },
    { id: 'blockchain-data', title: '2. Decentralized Architecture & Public Blockchain Data' },
    { id: 'data-we-collect', title: '3. Information We Collect' },
    { id: 'how-we-use-data', title: '4. How We Use Information' },
    { id: 'third-party-services', title: '5. Third-Party Service Providers' },
    { id: 'content-moderation', title: '6. Content Moderation & Safe Harbor (DMCA)' },
    { id: 'cookies-tracking', title: '7. Cookies, Local Storage & Tracking' },
    { id: 'user-rights', title: '8. Global Privacy Rights (GDPR & CCPA)' },
    { id: 'data-retention', title: '9. Data Retention & Immutability' },
    { id: 'security', title: '10. Security Safeguards' },
    { id: 'minors', title: '11. Age Restrictions & Minors' },
    { id: 'changes', title: '12. Updates to this Policy' },
    { id: 'contact', title: '13. Contact Information' },
  ];

  return (
    <div className="min-h-screen transition-colors duration-700 font-sans selection:bg-cyan-500/30 overflow-x-hidden bg-gradient-to-br from-slate-900 via-[#0B0C15] to-slate-950 text-slate-100">
      {/* BACKGROUND AMBIENCE */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <FolderLock className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              LinkLockr
            </span>
            <span className="block text-[10px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              Base Smart Contract Paywall
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to App</span>
        </Link>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 space-y-12">
        {/* HERO TITLE */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy &amp; Data Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
            <span>Effective Date: {lastUpdated}</span>
            <span>•</span>
            <span>Version: 2.1 (Base Mainnet)</span>
          </div>
        </div>

        {/* SUMMARY CALLOUT */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 shadow-2xl shadow-cyan-950/20 space-y-4">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm tracking-wide uppercase">
            <Lock className="w-4 h-4" />
            <span>Summary for Creators &amp; Buyers</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            LinkLockr is a non-custodial decentralized paywall protocol operating on the Base blockchain (Ethereum Layer 2). We are built on privacy-first principles:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Zero Ad Trackers:</strong> No Google Analytics, Meta Pixels, or commercial data brokers.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>No Raw File Hosting:</strong> We never host or store your media files; you keep them on your own host.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Decentralized Encryption:</strong> Content keys are guarded by Lit Protocol TEEs, not LinkLockr servers.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Non-Custodial Payments:</strong> 97.5% of unlock fees go straight to the creator&apos;s wallet on Base via smart contract.</span>
            </div>
          </div>
        </div>

        {/* QUICK NAVIGATION */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs">
          <h2 className="font-bold text-slate-200 text-sm mb-3">Table of Contents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="hover:text-cyan-400 transition-colors truncate"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>

        {/* LEGAL SECTIONS */}
        <div className="space-y-12 text-sm leading-relaxed text-slate-300">

          {/* SECTION 1 */}
          <section id="overview" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>1. Overview &amp; Core Philosophy</span>
            </h2>
            <p>
              LinkLockr (&quot;LinkLockr&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a decentralized paywall platform available at <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded">https://linklockr.xyz</code>. This Privacy Policy details our practices concerning data collection, transmission, encryption, and disclosure when you visit or interact with our website, smart contracts, or application interfaces.
            </p>
            <p>
              Our protocol is specifically architected to minimize centralized data collection. Unlike traditional digital commerce portals, we do not require accounts, usernames, passwords, credit card numbers, or billing addresses to use our service. All value exchange is settled peer-to-peer through audited smart contracts deployed on the Base network, and access control is enforced cryptographically using decentralized threshold cryptography.
            </p>
          </section>

          {/* SECTION 2 */}
          <section id="blockchain-data" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>2. Decentralized Architecture &amp; Public Blockchain Data</span>
            </h2>
            <p>
              When you create a locked link, execute a purchase, or interact with LinkLockr&apos;s smart contracts, your actions generate public, cryptographic records on the <strong>Base blockchain</strong> (a Layer 2 network secured by Ethereum).
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Notice Regarding Blockchain Immutability</span>
              </div>
              <p className="text-xs text-slate-400">
                Public wallet addresses (EOAs or smart contract wallets), on-chain transaction hashes, block numbers, gas fees, USDC transfer amounts, and ERC-1155 token minting events are broadcast globally across distributed network nodes. Blockchain data is inherently public, permanent, and immutable. <strong>Neither LinkLockr nor any third party has the technical capability to delete, alter, erase, or reverse transactions recorded on the Base blockchain ledger.</strong>
              </p>
            </div>
            <p>
              You may inspect all on-chain transactions executed through our contract at any time via public block explorers such as <a href="https://basescan.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-0.5">BaseScan <ExternalLink className="w-3 h-3" /></a>.
            </p>
          </section>

          {/* SECTION 3 */}
          <section id="data-we-collect" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span>3. Information We Collect</span>
            </h2>
            <p>We categorize information collected or processed through the platform as follows:</p>
            
            <div className="space-y-3 pl-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-cyan-400">A. Content &amp; Encrypted Payloads</h4>
                <p className="text-xs text-slate-300">
                  When a creator locks a link or secret text, the payload is encrypted using <strong>Lit Protocol</strong> threshold cryptography running on Trusted Execution Environments (TEEs). The resulting ciphertext and access control parameters are pinned on the InterPlanetary File System (IPFS) via Pinata. <strong>LinkLockr never stores or possesses your unencrypted plaintext secret or link on our servers.</strong> Decryption keys are held across distributed Lit Protocol validator nodes and are only assembled inside client browsers upon verification of token ownership.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-cyan-400">B. Link Metadata &amp; Database Indexing</h4>
                <p className="text-xs text-slate-300">
                  To provide fast search, discoverability, and moderation gating, public link metadata is indexed in our secure cloud database (Supabase). This includes: link slug identifier, Keccak-256 hash of the slug, creator wallet address, display price in USD, derived ETH equivalent at creation, IPFS CID pointer, creation timestamp, sensitive/18+ flag, and moderation lifecycle status (<code className="text-slate-400">active</code>, <code className="text-slate-400">flagged</code>, <code className="text-slate-400">hidden</code>, or <code className="text-slate-400">banned</code>).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-cyan-400">C. Web3 Authentication &amp; Embedded Wallets</h4>
                <p className="text-xs text-slate-300">
                  Users may connect existing self-custody Web3 wallets (e.g., MetaMask, Coinbase Wallet, Phantom, Rainbow) or use embedded wallet services powered by <strong>Privy</strong> (Privy.io). If you authenticate through Privy using an email address, SMS, or social account, Privy handles the creation and recovery of your non-custodial embedded wallet. Privy&apos;s independent privacy policy governs their collection of email or phone information; LinkLockr does not retain your personal social credentials in our core databases.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-cyan-400">D. Community Moderation &amp; Abuse Reports</h4>
                <p className="text-xs text-slate-300">
                  To protect consumers from scams and illegal material under Safe Harbor rules, users can submit reports against malicious links. Moderation reports record the target slug, reporter&apos;s public wallet address (verified by cryptographic signature to prevent automated sybil spam), verification of whether the reporter is a token holder (for weighted review), category reason, and timestamp.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-cyan-400">E. Technical Logs &amp; Infrastructure Telemetry</h4>
                <p className="text-xs text-slate-300">
                  When accessing our website, web servers and reverse proxy providers (Cloudflare and Vercel) log standard network transmission requests. These logs may contain your Internet Protocol (IP) address, operating system, browser type, referring URL, and request timestamps. This telemetry is collected solely for DDoS mitigation, infrastructure health, rate limiting, and security compliance.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4 */}
          <section id="how-we-use-data" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>4. How We Use Information</span>
            </h2>
            <p>LinkLockr processes the minimal data described above exclusively for legitimate operational purposes:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
              <li><strong>Facilitating Token Settlement:</strong> Verifying ERC-1155 token balances to enable browser client decryption via Lit Protocol.</li>
              <li><strong>Displaying Creator Dashboards:</strong> Enabling creators to view their locked links, sales history, and unlocked library via wallet connection.</li>
              <li><strong>Preventing Abuse &amp; Illegal Content:</strong> Computing weighted moderation scores to automatically flag or hide malicious links, phishing attempts, malware, or prohibited content.</li>
              <li><strong>Platform Security &amp; Performance:</strong> Detecting and mitigating denial-of-service (DDoS) attacks, automated scraping, or bot manipulation.</li>
              <li><strong>Legal Compliance:</strong> Responding to verifiable DMCA copyright notices, valid subpoenas, or urgent safety requests.</li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section id="third-party-services" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>5. Third-Party Service Providers</span>
            </h2>
            <p>
              Our decentralized architecture interacts with select infrastructure providers to deliver functionality. We encourage you to review their respective privacy policies:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="font-bold text-white block mb-1">Base Network (Coinbase)</span>
                <p className="text-slate-400">Decentralized Layer 2 roll-up executing transactions, smart contract logic, and USDC payments.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="font-bold text-white block mb-1">Lit Protocol</span>
                <p className="text-slate-400">Decentralized key management network executing cryptographic condition evaluation within TEE enclaves.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="font-bold text-white block mb-1">Pinata Technologies</span>
                <p className="text-slate-400">IPFS pinning service preserving encrypted content pointers and cryptographic access parameters.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="font-bold text-white block mb-1">Privy (Privy.io)</span>
                <p className="text-slate-400">Embedded Web3 wallet onboarding, email/SMS authentication, and key management infrastructure.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="font-bold text-white block mb-1">Supabase</span>
                <p className="text-slate-400">Managed PostgreSQL database hosting link metadata indexing, moderation vote tracking, and RLS security.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="font-bold text-white block mb-1">Vercel &amp; Cloudflare</span>
                <p className="text-slate-400">Edge hosting, DNS management, SSL/TLS certificate termination, and global DDoS mitigation.</p>
              </div>
            </div>
          </section>

          {/* SECTION 6 */}
          <section id="content-moderation" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-cyan-400" />
              <span>6. Content Moderation, Safe Harbor &amp; DMCA</span>
            </h2>
            <p>
              LinkLockr operates strictly as a neutral technology infrastructure provider. Because LinkLockr acts as an access gateway and does not host content files directly:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
              <li><strong>Zero Tolerance Prohibitions:</strong> We strictly prohibit the use of LinkLockr to monetize or distribute Child Sexual Abuse Material (CSAM), non-consensual sexual content, terrorism, violent extremism, malware, ransomware, credentials theft, or fraudulent phishing schemes.</li>
              <li><strong>Community Safe Harbor System:</strong> We enforce an automated threshold reporting mechanism. If community reports exceed configured weighted thresholds, the link is immediately marked as <code className="text-amber-400">flagged</code> (hidden from new buyers) or <code className="text-red-400">hidden</code> pending admin review.</li>
              <li><strong>DMCA / Copyright Notices:</strong> If you are a copyright owner or agent and believe content accessible through a LinkLockr URL infringes upon your copyright, please submit an expedited takedown notice to our designated agent at <a href="mailto:copyright@linklockr.xyz" className="text-cyan-400 hover:underline">copyright@linklockr.xyz</a>. Valid notices are processed promptly to remove public indexing and disable routing through our interfaces.</li>
            </ul>
          </section>

          {/* SECTION 7 */}
          <section id="cookies-tracking" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cookie className="w-5 h-5 text-cyan-400" />
              <span>7. Cookies, Local Storage &amp; Tracking</span>
            </h2>
            <p>
              We do not utilize tracking cookies, behavioral remarketing cookies, or cross-domain ad profiling. We strictly use limited, essential client-side storage technologies:
            </p>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div><strong className="text-white">NEXT_LOCALE Cookie:</strong> Remembers your chosen language (English, Spanish, Portuguese, or Chinese).</div>
              <div><strong className="text-white">Theme Preference (Local Storage):</strong> Remembers whether you selected Light Mode or Dark Mode.</div>
              <div><strong className="text-white">Web3 &amp; Privy Session Storage:</strong> Maintains an active wallet connection state in your local browser cache during your active session.</div>
            </div>
            <p>
              You may clear your browser cookies and local storage at any time via your browser settings without affecting the underlying validity of your on-chain tokens.
            </p>
          </section>

          {/* SECTION 8 */}
          <section id="user-rights" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <span>8. Global Privacy Rights (GDPR &amp; CCPA/CPRA)</span>
            </h2>
            <p>
              Depending on your country or state of residence (including the European Economic Area, United Kingdom, and California), you may possess statutory rights under privacy regulations such as the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA/CPRA):
            </p>
            <div className="space-y-2 text-xs text-slate-300 pl-2">
              <p><strong>Right to Access:</strong> You may request confirmation of any off-chain personal data we hold associated with your wallet address.</p>
              <p><strong>Right to Rectification &amp; Erasure:</strong> You may request the deletion or de-indexing of links you created from our off-chain database (Supabase index).</p>
              <p><strong>California &quot;Do Not Sell or Share My Information&quot;:</strong> LinkLockr has never sold, rented, or shared personal data with data brokers or marketing vendors, and will never do so.</p>
              <p className="text-slate-400 italic">
                <strong>Important Blockchain Qualification:</strong> As noted in Section 2, the statutory &quot;Right to be Forgotten&quot; cannot be exercised over transactions published to the Base blockchain due to cryptographic immutability. By executing an on-chain transaction, you acknowledge this technical reality.
              </p>
            </div>
          </section>

          {/* SECTION 9 */}
          <section id="data-retention" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              <span>9. Data Retention &amp; Immutability</span>
            </h2>
            <p>
              Off-chain indexed metadata in Supabase is retained for as long as necessary to maintain link routing and facilitate customer redemption. If an admin bans or removes a link for terms violations, the slug is permanently marked as <code className="text-red-400">banned</code> and excluded from public queries. Temporary technical server logs collected by Cloudflare or Vercel are rotated and deleted automatically in accordance with standard infrastructure log retention cycles (typically 30 to 90 days).
            </p>
          </section>

          {/* SECTION 10 */}
          <section id="security" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>10. Security Safeguards</span>
            </h2>
            <p>
              We implement industry-grade defense-in-depth security standards:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
              <li>All web traffic is enforced over TLS 1.3 encryption with strict HTTP Strict Transport Security (HSTS).</li>
              <li>Row Level Security (RLS) is enabled across all database tables, preventing unauthorized modifications of link statuses or report records.</li>
              <li>Lit Protocol encryption keys are secured within decentralized hardware Trusted Execution Environments (AMD SEV-SNP enclaves).</li>
              <li>Authentication signatures rely on standardized EIP-4361 (Sign-In with Ethereum) cryptographic standards.</li>
            </ul>
          </section>

          {/* SECTION 11 */}
          <section id="minors" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-cyan-400" />
              <span>11. Age Restrictions &amp; Minors</span>
            </h2>
            <p>
              LinkLockr is intended solely for persons who are at least 18 years of age or the age of majority in their jurisdiction. We do not knowingly collect personal information from children under the age of 13 (or under 16 in certain European jurisdictions). If we become aware that a minor has provided information or created an account, we will take immediate steps to remove such records from our databases.
            </p>
          </section>

          {/* SECTION 12 */}
          <section id="changes" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>12. Updates to this Policy</span>
            </h2>
            <p>
              We reserve the right to revise or update this Privacy Policy periodically to reflect technological advancements, smart contract upgrades, regulatory developments, or platform modifications. The current version will always be published at <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded">https://linklockr.xyz/privacy-policy</code> with the &quot;Effective Date&quot; revised accordingly.
            </p>
          </section>

          {/* SECTION 13 */}
          <section id="contact" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              <span>13. Contact Information</span>
            </h2>
            <p>
              For inquiries, legal notices, or privacy questions regarding LinkLockr:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Privacy Queries</span>
                <a href="mailto:privacy@linklockr.xyz" className="text-cyan-400 hover:underline">
                  privacy@linklockr.xyz
                </a>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">DMCA / Copyright</span>
                <a href="mailto:copyright@linklockr.xyz" className="text-cyan-400 hover:underline">
                  copyright@linklockr.xyz
                </a>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Creator Relations</span>
                <a href="mailto:creators@linklockr.xyz" className="text-cyan-400 hover:underline">
                  creators@linklockr.xyz
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md py-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">LinkLockr</span>
            <span>• Base Smart Contract USDC Paywall</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
              App
            </Link>
            <Link href="/creators" className="hover:text-cyan-400 transition-colors">
              For Creators
            </Link>
            <Link href="/terms-of-service" className="hover:text-cyan-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="text-cyan-400 font-semibold transition-colors">
              Privacy Policy
            </Link>
            <a
              href="mailto:copyright@linklockr.xyz"
              className="hover:text-cyan-400 transition-colors"
            >
              DMCA (copyright@linklockr.xyz)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
