// components/ReportButton.tsx
'use client';

import { supabase } from '@/utils/supabase';
import { useTranslations } from 'next-intl';
import { usePrivy } from '@privy-io/react-auth';

export function ReportButton({ slug, userHasAccess }: { slug: string, userHasAccess: boolean }) {
  const t = useTranslations('Moderation');
  const { user, authenticated, login } = usePrivy();

  const handleReport = async () => {
  // 1. Identity Gate
  if (!authenticated) {
    if (confirm(t('connect_to_report'))) login();
    return;
  }

  // 2. Input Validation
  const reason = window.prompt(t('report_reason_prompt'));
  if (!reason || reason.trim().length < 5) {
    alert(t('report_reason_too_short'));
    return; // <--- Just return here, no need for 'else' block
  }

  // 3. Database Action
  const { error } = await supabase
    .from('link_reports')
    .insert([
      { 
        slug, 
        reason, 
        reporter_address: user?.wallet?.address.toLowerCase(), // Required from Privy
        is_buyer: userHasAccess // Required from Prop
      }
    ]);

  // 4. Error Handling
  if (error) {
    console.error('Error reporting link:', error);
    if (error.code === '23505') {
      alert(t('already_reported'));
    } else {
      alert(t('report_error'));
    }
  } else {
    alert(t('report_success'));
    window.location.reload(); 
  }
};

  return (
    <button onClick={handleReport} className="text-red-500/60 hover:text-red-400 text-xs underline px-2 py-1">
      {t('report_link')}
    </button>
  );
}