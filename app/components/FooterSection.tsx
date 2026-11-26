import React from 'react';
import { FolderLock, ExternalLink } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export default function FooterSection() {
  return (
    <footer className="mt-32 pt-10 border-t border-slate-200 dark:border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <FolderLock size={15} className="text-sky-600 dark:text-cyan-400" />
        <span className="font-bold text-slate-700 dark:text-slate-300">LinkLockr</span>
        <span>• Base Smart Contract USDC</span>
      </div>

      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-3">
        <LanguageSwitcher />

        <a
          href="/creators"
          className="hover:text-sky-600 dark:text-cyan-400/90 font-medium transition-colors"
        >
          For Creators &amp; VIP Links
        </a>

        <a
          href="/terms-of-service"
          className="hover:text-sky-600 dark:text-cyan-400/90 font-medium transition-colors"
        >
          Terms of Service
        </a>

        <a
          href="/privacy-policy"
          className="hover:text-sky-600 dark:text-cyan-400/90 font-medium transition-colors"
        >
          Privacy Policy
        </a>

        <a
          href={`https://basescan.org/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-sky-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1"
        >
          <span>BaseScan Contract</span>
          <ExternalLink size={12} />
        </a>

        <a
          href="mailto:copyright@linklockr.xyz"
          className="hover:text-sky-600 dark:hover:text-cyan-400 transition-colors"
        >
          DMCA / Copyright (copyright@linklockr.xyz)
        </a>
      </div>
    </footer>
  );
}
