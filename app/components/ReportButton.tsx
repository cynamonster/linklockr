// components/ReportButton.tsx
'use client';

import { supabase } from '@/utils/supabase';
import { useTranslations } from 'next-intl';
import { usePrivy } from '@privy-io/react-auth';

export function ReportButton({ slug, userHasAccess }: { slug: string, userHasAccess: boolean }) {
  const t = useTranslations('Moderation');
  const { user, authenticated, login } = usePrivy();

  const handleReport = async () => {
    if (!authenticated) {
      if (confirm(t('connect_to_report'))) login();
      return;
    }

    const reason = window.prompt(t('report_reason_prompt'));
    if (!reason || reason.trim().length < 5) {
      alert(t('report_reason_too_short'));
    //   return;
    } else {
        const { error } = await supabase
        .from('link_reports')
        .insert([
            { 
            slug, 
            reason, 
            reporter_address: user?.wallet?.address,
            is_buyer: userHasAccess 
            }
        ]);

        if (error) {
            console.error('Error reporting link:', error);
        // Handle the "Unique Constraint" error specifically
        if (error.code === '23505') {
            alert(t('already_reported'));
        } else {
            alert(t('report_error'));
        }
        } else {
        alert(t('report_success'));
        window.location.reload(); // Refresh to show "Flagged" state if threshold met
        }
    }
  };

  return (
    <button onClick={handleReport} className="text-red-500/60 hover:text-red-400 text-xs underline px-2 py-1">
      {t('report_link')}
    </button>
  );
}