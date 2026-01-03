// components/ReportButton.tsx
'use client';

import { useTranslations } from 'next-intl';
import { supabase } from '../../utils/supabase';
import { usePrivy } from '@privy-io/react-auth';

export function ReportButton({ slug, userHasAccess }: { slug: string, userHasAccess: boolean }) {
  const t = useTranslations('Moderation'); // Use the namespace from our JSON
  const { user, authenticated, login } = usePrivy();

  const handleReport = async () => {
    if (!authenticated) {
      if (confirm(t('connect_to_report'))) login();
      return;
    }

    const reason = window.prompt(t('report_reason_prompt'));
    if (!reason || reason.length < 5) return;

    const { error } = await supabase.from('link_reports').insert({
      slug,
      reason,
      reporter_address: user?.wallet?.address,
      is_buyer: userHasAccess
    });

    if (error) {
       alert(t('report_error'));
    } else {
      alert(t('report_success'));
    }
  };

  return (
    <button 
      onClick={handleReport}
      className="text-xs text-red-500/70 hover:text-red-500 underline transition-colors"
    >
      {t('report_button')}
    </button>
  );
}