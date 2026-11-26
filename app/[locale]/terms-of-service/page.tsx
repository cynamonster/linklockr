import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { 
  FolderLock, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  ArrowLeft, 
  Scale, 
  FileText, 
  Ban, 
  Coins, 
  Mail, 
  ExternalLink,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Terms of Service | LinkLockr',
    description:
      'Terms of Service and User Agreement for LinkLockr (linklockr.xyz) — decentralized link encryption, smart contract access control on Base, non-custodial usage, and DMCA policy.',
    openGraph: {
      title: 'Terms of Service | LinkLockr',
      description:
        'Terms of Service and User Agreement for LinkLockr. Read our policies regarding non-custodial operations, Base on-chain settlement, prohibited content, and DMCA copyright procedures.',
      url: 'https://linklockr.xyz/terms-of-service',
      siteName: 'LinkLockr',
      images: [
        {
          url: 'https://linklockr.xyz/api/og',
          width: 1200,
          height: 630,
          alt: 'LinkLockr Terms of Service',
        },
      ],
      type: 'website',
    },
  };
}

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen transition-colors duration-700 font-sans selection:bg-cyan-500/30 overflow-x-hidden bg-gradient-to-br from-slate-900 via-[#0B0C15] to-slate-950 text-slate-100">
      {/* BACKGROUND AMBIENCE */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
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
              Legal &amp; User Agreement
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-400 transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to App</span>
        </Link>
      </header>

      {/* HERO / HEADER SECTION */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 space-y-12">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/50">
            <Scale className="w-3.5 h-3.5" />
            <span>Last Updated: November 26, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Please read these Terms of Service (&quot;Terms&quot;) carefully before using the LinkLockr interface accessible at{' '}
            <span className="font-mono text-cyan-400">linklockr.xyz</span> (the &quot;Interface&quot; or &quot;Platform&quot;). These Terms constitute a binding legal agreement between you (&quot;User&quot;, &quot;Creator&quot;, &quot;Buyer&quot;, or &quot;You&quot;) and LinkLockr.
          </p>
        </section>

        {/* KEY HIGHLIGHTS BOX */}
        <section className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 shadow-2xl shadow-cyan-950/30 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Summary of Key Principles</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800/80 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Non-Custodial Interface</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                We never store, host, or possess your digital media files or private keys. Content is hosted by creators on external hosts; LinkLockr coordinates cryptographic access control.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800/80 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-cyan-400" />
                <span>Immutable On-Chain Settlement</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Payments settle natively in USDC / ETH on Base. On-chain blockchain transactions cannot be canceled, reversed, or refunded once broadcast.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800/80 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                <span>Zero Tolerance for Illegal Content</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                CSAM, malware, phishing, non-consensual imagery, and IP infringement are strictly prohibited and immediately blocked from the Interface.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800/80 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Interface Moderation Right</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                LinkLockr reserves the unilateral right to delist, hide, or blur violating links from linklockr.xyz following community reports or DMCA notices.
              </p>
            </div>
          </div>
        </section>

        {/* FULL LEGAL ARTICLES */}
        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          
          {/* SECTION 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">01.</span>
              <span>Acceptance of Terms &amp; Scope of Service</span>
            </h2>
            <p>
              By accessing, browsing, interacting with, or connecting a Web3 wallet (such as Privy, MetaMask, Coinbase Wallet, or Rainbow) to linklockr.xyz, you agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any part of these Terms, you must immediately discontinue use of the Interface.
            </p>
            <p>
              LinkLockr operates as a managed web interface interacting with decentralized smart contracts deployed on the Base blockchain network and decentralized key management via Lit Protocol Trusted Execution Environments (TEEs). The underlying smart contracts operate autonomously on-chain without administrative backdoors or protocol owner keys. LinkLockr provides the graphical user interface, vanity slug management, and interface-level moderation.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">02.</span>
              <span>Eligibility &amp; Age Restriction</span>
            </h2>
            <p>
              You must be at least 18 years of age (or the age of legal majority in your jurisdiction) to access or use LinkLockr. By creating or unlocking links, you certify that you are at least 18 years old.
            </p>
            <p>
              You further represent that you are not located in, under the control of, or a national or resident of any country or region subject to sanctions imposed by the U.S. Office of Foreign Assets Control (OFAC) or other international sanctions authorities, nor are you listed on any restricted party lists.
            </p>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">03.</span>
              <span>Non-Custodial Architecture &amp; Third-Party Hosting</span>
            </h2>
            <p>
              <strong className="text-white">Content Hosting:</strong> LinkLockr does NOT store, host, cache, or transmit your underlying files, images, videos, software, or digital assets. Creators host their content on independent third-party platforms of their own choosing (e.g., Mega, Google Drive, Dropbox, private web servers, or private Telegram VIP channels). LinkLockr functions solely as an encrypted access gateway that permits access to a creator-specified destination URL after on-chain payment verification.
            </p>
            <p>
              <strong className="text-white">Wallet &amp; Funds Custody:</strong> LinkLockr is non-custodial. We do not hold, custody, or have access to your private keys, seed phrases, or cryptocurrency tokens. You maintain sole responsibility for the custody, security, and backup of your Web3 wallet and credentials.
            </p>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">04.</span>
              <span>On-Chain Payments, Convenience Fees &amp; No Refunds</span>
            </h2>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Irreversible Blockchain Transactions Notice</span>
              </div>
              <p>
                All purchases made through smart contracts on the Base network are permanent, irreversible, and final. There are no credit card chargebacks, merchant reversals, or retroactive cancellations possible.
              </p>
            </div>
            <p>
              <strong className="text-white">Platform Convenience Fee:</strong> For transactions conducted via the linklockr.xyz interface, a convenience fee (typically 2.5%, or 250 basis points) is collected directly by the smart contract upon successful unlock, with the remaining 97.5% sent directly and instantaneously to the Creator&apos;s specified wallet address.
            </p>
            <p>
              <strong className="text-white">Gas Fees:</strong> Buyers and creators are responsible for any blockchain gas fees required to process transactions on the Base network. LinkLockr does not control gas costs.
            </p>
            <p>
              <strong className="text-white">No Refunds:</strong> Because all transfers occur directly between the buyer and creator via smart contract without intermediary escrow, LinkLockr cannot issue refunds. Buyers must exercise due diligence before unlocking any link.
            </p>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">05.</span>
              <span>Creator Obligations &amp; Content Warranties</span>
            </h2>
            <p>
              If you create a paywalled link on LinkLockr, you expressly warrant and represent that:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-400">
              <li>You own, or hold all lawful licenses, rights, and consents to distribute and monetize the underlying content;</li>
              <li>Your destination link is functional, accurate, and delivers the exact goods, files, or access promised in the title and description;</li>
              <li>You will maintain the destination link for buyers who have purchased access;</li>
              <li>Your content does not violate any local, national, or international laws, nor infringe any third-party intellectual property, privacy, or publicity rights;</li>
              <li>You will not misrepresent the nature or quality of the content to deceive buyers.</li>
            </ul>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">06.</span>
              <span>Strictly Prohibited Uses &amp; Illegal Content</span>
            </h2>
            <p>
              You agree not to use LinkLockr to lock, monetize, distribute, or facilitate access to any of the following:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 text-slate-300">
                <span className="font-bold text-rose-400 block mb-1">Minor Exploitation &amp; CSAM</span>
                Any Child Sexual Abuse Material (CSAM), depiction of sexual exploitation of minors, or child abuse in any form. LinkLockr maintains zero tolerance and will immediately report violations to the National Center for Missing &amp; Exploited Children (NCMEC) and law enforcement.
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 text-slate-300">
                <span className="font-bold text-rose-400 block mb-1">Non-Consensual Imagery (NCII)</span>
                Non-consensual intimate imagery, unauthorized revenge pornography, deepfakes, or imagery captured without explicit, verifiable consent of all depicted individuals.
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 text-slate-300">
                <span className="font-bold text-rose-400 block mb-1">Malware, Exploits &amp; Phishing</span>
                Viruses, trojans, ransomware, keyloggers, botnet access, exploit payloads, credential harvesting sites, or phishing portals designed to compromise systems or drain crypto wallets.
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 text-slate-300">
                <span className="font-bold text-rose-400 block mb-1">Stolen Data &amp; Fraud</span>
                Stolen credit card information, bank logs, hacked account databases, identity theft data, counterfeit documents, or fraudulent financial schemes.
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 text-slate-300">
                <span className="font-bold text-rose-400 block mb-1">Violent Extremism &amp; Weapons</span>
                Content promoting terrorism, violent extremist organizations, instructions for manufacturing lethal weapons or explosives, or direct incitement of physical violence.
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 text-slate-300">
                <span className="font-bold text-rose-400 block mb-1">Controlled Substances</span>
                Sale of illegal narcotics, unregulated pharmaceuticals, chemical weapons, or black-market controlled substances.
              </div>
            </div>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">07.</span>
              <span>Interface Moderation &amp; Delisting Policy</span>
            </h2>
            <p>
              To maintain the integrity and safety of the ecosystem, LinkLockr provides an on-page community reporting mechanism. The Interface enforces automated and manual moderation safeguards:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-400">
              <li>
                <strong className="text-slate-200">Flagged Warning (Blur):</strong> Links receiving unique verified reports are marked with a prominent advisory (&quot;Content flagged for review. Purchase at your own risk.&quot;).
              </li>
              <li>
                <strong className="text-slate-200">Hard Takedown &amp; Interface Delisting:</strong> Links that violate these Terms or receive multiple reports or formal DMCA notices are immediately blocked from the linklockr.xyz interface. Purchasing and decryption through the Interface are disabled.
              </li>
              <li>
                <strong className="text-slate-200">Scope of Action:</strong> While blockchain state entries cannot be altered retroactively on Base, LinkLockr reserves the perpetual, unilateral right to refuse, restrict, blur, or delist any slug, link, or wallet address from appearing on or interacting through the linklockr.xyz frontend.
              </li>
            </ul>
          </section>

          {/* SECTION 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">08.</span>
              <span>DMCA &amp; Copyright Infringement Policy</span>
            </h2>
            <p>
              LinkLockr respects the intellectual property rights of creators and complies with the provisions of the Digital Millennium Copyright Act (17 U.S.C. § 512). If you believe that your copyrighted work is being unlawfully linked or monetized via LinkLockr without authorization, you may submit a formal DMCA Takedown Notice to our designated copyright agent.
            </p>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-white flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>DMCA Notice Requirements</span>
              </div>
              <p className="text-slate-400">
                Send your written notice to <a href="mailto:copyright@linklockr.xyz" className="text-cyan-400 hover:underline font-mono">copyright@linklockr.xyz</a> containing the following information:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                <li>Identification of the copyrighted work claimed to have been infringed;</li>
                <li>The specific LinkLockr URL / slug (e.g., <code className="text-cyan-400 font-mono">linklockr.xyz/buy/example-slug</code>) where the infringing activity is accessible;</li>
                <li>Your contact information, including full name, address, telephone number, and email;</li>
                <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law;</li>
                <li>A statement made under penalty of perjury that the information in the notification is accurate and that you are authorized to act on behalf of the copyright owner;</li>
                <li>A physical or electronic signature of the copyright owner or authorized representative.</li>
              </ol>
            </div>
            <p className="text-xs text-slate-400">
              Upon receipt of a compliant notice, LinkLockr will promptly remove, disable, or delist access to the infringing material on the Interface. Repeat infringers will be permanently barred from the Interface.
            </p>
          </section>

          {/* SECTION 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">09.</span>
              <span>Assumption of Risk &amp; Web3 Disclaimers</span>
            </h2>
            <p>
              You acknowledge that using blockchain technologies, decentralized networks, and smart contracts involves inherent technical and market risks. By using LinkLockr, you understand and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-400">
              <li>Smart contracts are subject to technical vulnerabilities, network downtime, reorgs, or hard forks on Base;</li>
              <li>Decentralized encryption and decryption depend on the availability and consensus of third-party node networks (including Lit Protocol);</li>
              <li>You alone are responsible for safeguarding your private keys, wallet signatures, and verifying addresses before signing transactions;</li>
              <li>Digital asset valuations and gas prices fluctuate rapidly and without notice.</li>
            </ul>
          </section>

          {/* SECTION 10 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">10.</span>
              <span>Disclaimer of Warranties</span>
            </h2>
            <p className="uppercase text-xs font-semibold tracking-wide text-slate-400">
              THE INTERFACE AND SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;, WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, LINKLOCKR DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, AND NON-INFRINGEMENT.
            </p>
          </section>

          {/* SECTION 11 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">11.</span>
              <span>Limitation of Liability</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LINKLOCKR, ITS OPERATORS, CONTRIBUTORS, AFFILIATES, OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, DATA, GOODWILL, CRYPTOCURRENCY ASSETS, OR OTHER INTANGIBLE LOSSES) ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE INTERFACE, THIRD-PARTY DESTINATION LINKS, OR SMART CONTRACTS, REGARDLESS OF THE THEORY OF LIABILITY. IN NO EVENT SHALL OUR TOTAL AGGREGATE LIABILITY EXCEED THE LESSER OF (A) THE FEES ACTUALLY RECEIVED BY LINKLOCKR FROM YOUR TRANSACTIONS IN THE THREE (3) MONTHS PRECEDING THE CLAIM OR (B) ONE HUNDRED US DOLLARS ($100.00 USD).
            </p>
          </section>

          {/* SECTION 12 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">12.</span>
              <span>Indemnification</span>
            </h2>
            <p>
              You agree to defend, indemnify, and hold harmless LinkLockr, its operators, contractors, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a) your use of or access to the Interface; (b) any content, URLs, or files you lock, upload, or sell; (c) your violation of these Terms; or (d) your infringement or violation of any third-party rights, including intellectual property or privacy rights.
            </p>
          </section>

          {/* SECTION 13 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">13.</span>
              <span>Modifications to Terms &amp; Interface</span>
            </h2>
            <p>
              We reserve the right to revise, modify, or update these Terms at any time in our sole discretion. Any changes will become effective immediately upon posting to this page, with the revised date reflected at the top. Your continued use of the Interface after any modification constitutes your acceptance of the updated Terms.
            </p>
          </section>

          {/* SECTION 14 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">14.</span>
              <span>Contact Information</span>
            </h2>
            <p>
              If you have any questions, inquiries, or feedback regarding these Terms, or if you need to submit a legal notice, please contact:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">DMCA &amp; Copyright Issues</span>
                <a
                  href="mailto:copyright@linklockr.xyz"
                  className="text-cyan-400 hover:text-cyan-300 font-mono font-medium text-xs flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>copyright@linklockr.xyz</span>
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Creator &amp; General Inquiries</span>
                <a
                  href="mailto:creators@linklockr.xyz"
                  className="text-cyan-400 hover:text-cyan-300 font-mono font-medium text-xs flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>creators@linklockr.xyz</span>
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/60 bg-slate-950/60 backdrop-blur-md py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <FolderLock size={15} className="text-cyan-400" />
            <span className="font-bold text-slate-300">LinkLockr</span>
            <span>• Base Smart Contract USDC</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-3">
            <Link
              href="/"
              className="hover:text-cyan-400 transition-colors"
            >
              App Home
            </Link>

            <Link
              href="/creators"
              className="hover:text-cyan-400 transition-colors"
            >
              For Creators
            </Link>

            <Link
              href="/terms-of-service"
              className="text-cyan-400 font-medium"
            >
              Terms of Service
            </Link>

            <a
              href="mailto:copyright@linklockr.xyz"
              className="hover:text-cyan-400 transition-colors"
            >
              copyright@linklockr.xyz
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
