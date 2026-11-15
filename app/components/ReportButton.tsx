'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useTranslations } from 'next-intl';
import { usePrivy } from '@privy-io/react-auth';
import { AlertCircle, ShieldAlert, X, CheckCircle2, Mail, Flag, ExternalLink } from 'lucide-react';

const DMCA_EMAIL = process.env.NEXT_PUBLIC_DMCA_EMAIL || "dmca@linklockr.xyz";

interface ReportButtonProps {
  slug: string;
  userHasAccess: boolean;
}

export function ReportButton({ slug, userHasAccess }: ReportButtonProps) {
  const t = useTranslations('Moderation');
  const { user, authenticated, login } = usePrivy();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'dmca'>('report');

  // Form State - Community Report
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  // Form State - DMCA
  const [claimantName, setClaimantName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [workUrl, setWorkUrl] = useState("");
  const [infringementDetails, setInfringementDetails] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const [signature, setSignature] = useState("");
  const [isSubmittingDmca, setIsSubmittingDmca] = useState(false);
  const [dmcaStatus, setDmcaStatus] = useState<string | null>(null);

  const openModal = (tab: 'report' | 'dmca') => {
    setActiveTab(tab);
    setIsOpen(true);
    setReportStatus(null);
    setDmcaStatus(null);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  // 1. COMMUNITY REPORT SUBMIT (Existing Functionality Preserved)
  const handleCommunityReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated) {
      login();
      return;
    }

    if (!reportReason || reportReason.trim().length < 5) {
      alert(t('report_reason_too_short'));
      return;
    }

    setIsSubmittingReport(true);
    try {
      const { error } = await supabase
        .from('link_reports')
        .insert([
          {
            slug,
            reason: reportReason.trim(),
            reporter_address: user?.wallet?.address ? user.wallet.address.toLowerCase() : "anonymous",
            is_buyer: userHasAccess,
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          alert(t('already_reported'));
        } else {
          alert(t('report_error'));
        }
      } else {
        setReportStatus("success");
        setTimeout(() => {
          closeModal();
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      alert(t('report_error'));
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // 2. DMCA TAKEDOWN SUBMIT
  const handleDmcaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!claimantName || !claimantEmail || !workUrl || !infringementDetails || !signature || !goodFaith) {
      alert("Please complete all required fields and check the good faith confirmation.");
      return;
    }

    setIsSubmittingDmca(true);

    const fullDmcaNotice = `[DMCA TAKEDOWN NOTICE]
Target URL: https://linklockr.xyz/buy/${slug}
Claimant: ${claimantName}
Email: ${claimantEmail}
Original Work: ${workUrl}
Details: ${infringementDetails}
Good Faith Declaration: Agreed
Signature: ${signature}`;

    try {
      // 1. Log to Supabase link_reports for admin/VA review queue
      await supabase
        .from('link_reports')
        .insert([
          {
            slug,
            reason: fullDmcaNotice,
            reporter_address: claimantEmail.trim().toLowerCase(),
            is_buyer: false,
          }
        ]);

      // 2. Prepare pre-filled email mailto
      const subject = encodeURIComponent(`DMCA Takedown Notice: linklockr.xyz/buy/${slug}`);
      const body = encodeURIComponent(fullDmcaNotice);
      const mailtoUrl = `mailto:${DMCA_EMAIL}?subject=${subject}&body=${body}`;

      // Trigger mail client in background
      window.open(mailtoUrl, '_blank');

      setDmcaStatus("success");
    } catch (err) {
      console.error('Failed to log DMCA claim:', err);
      // Still allow mailto even if DB connection has an issue
      const subject = encodeURIComponent(`DMCA Takedown Notice: linklockr.xyz/buy/${slug}`);
      const body = encodeURIComponent(fullDmcaNotice);
      window.location.href = `mailto:${DMCA_EMAIL}?subject=${subject}&body=${body}`;
      setDmcaStatus("success");
    } finally {
      setIsSubmittingDmca(false);
    }
  };

  return (
    <>
      {/* TRIGGER BUTTONS */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => openModal('report')}
          className="hover:text-red-400 underline transition-colors cursor-pointer"
        >
          {t('report_link')}
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => openModal('dmca')}
          className="hover:text-cyan-400 underline transition-colors cursor-pointer"
        >
          {t('dmca_claim')}
        </button>
      </div>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* CLOSE BUTTON */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'report'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flag className="w-4 h-4" />
                <span>{t('tab_report')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('dmca')}
                className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'dmca'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t('tab_dmca')}</span>
              </button>
            </div>

            {/* TAB 1: COMMUNITY REPORT */}
            {activeTab === 'report' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span>{t('report_button')}</span>
                  </h2>
                  <p className="text-xs text-slate-400">{t('report_reason_prompt')}</p>
                </div>

                {reportStatus === 'success' ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-semibold text-emerald-300">{t('report_success')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleCommunityReport} className="space-y-4">
                    {!authenticated ? (
                      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center space-y-3">
                        <p className="text-sm text-slate-300">{t('connect_to_report')}</p>
                        <button
                          type="button"
                          onClick={login}
                          className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors cursor-pointer"
                        >
                          Connect Wallet
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {t('report_reason_placeholder')}
                          </label>
                          <textarea
                            rows={4}
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Explain the issue (e.g., scam, malware, broken link)..."
                            className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingReport || reportReason.trim().length < 5}
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2"
                          >
                            {isSubmittingReport ? "Submitting..." : t('report_submit')}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: COPYRIGHT / DMCA CLAIM */}
            {activeTab === 'dmca' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-cyan-400" />
                    <span>{t('dmca_title')}</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">{t('dmca_desc')}</p>
                </div>

                {dmcaStatus === 'success' ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h3 className="text-base font-bold text-emerald-300">Notice Registered</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{t('dmca_success')}</p>
                    <p className="text-xs text-slate-500">
                      If your email client did not open automatically, you can also email our compliance desk directly at{" "}
                      <a href={`mailto:${DMCA_EMAIL}`} className="text-cyan-400 underline font-mono">
                        {DMCA_EMAIL}
                      </a>
                    </p>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="mt-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDmcaSubmit} className="space-y-3.5 text-left text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">{t('claimant_name')} *</label>
                      <input
                        type="text"
                        required
                        value={claimantName}
                        onChange={(e) => setClaimantName(e.target.value)}
                        placeholder="e.g. Acme Media Corp / Jane Doe"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">{t('claimant_email')} *</label>
                      <input
                        type="email"
                        required
                        value={claimantEmail}
                        onChange={(e) => setClaimantEmail(e.target.value)}
                        placeholder="legal@yourdomain.com"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">{t('work_url')} *</label>
                      <input
                        type="url"
                        required
                        value={workUrl}
                        onChange={(e) => setWorkUrl(e.target.value)}
                        placeholder="https://originalwork.com/item or registration number"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">{t('infringement_details')} *</label>
                      <textarea
                        required
                        rows={2}
                        value={infringementDetails}
                        onChange={(e) => setInfringementDetails(e.target.value)}
                        placeholder="State why this link is unauthorized and describe the protected work..."
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <input
                        type="checkbox"
                        id="goodFaith"
                        required
                        checked={goodFaith}
                        onChange={(e) => setGoodFaith(e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/30 cursor-pointer"
                      />
                      <label htmlFor="goodFaith" className="text-[11px] text-slate-400 leading-tight cursor-pointer">
                        {t('good_faith_checkbox')}
                      </label>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">{t('electronic_signature')} *</label>
                      <input
                        type="text"
                        required
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        placeholder="Type your full legal name as signature"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <a
                        href={`mailto:${DMCA_EMAIL}?subject=DMCA Claim: ${slug}`}
                        className="text-slate-500 hover:text-slate-400 text-[11px] flex items-center gap-1 underline"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Or email directly</span>
                      </a>

                      <button
                        type="submit"
                        disabled={isSubmittingDmca}
                        className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{isSubmittingDmca ? "Submitting..." : t('submit_dmca')}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
