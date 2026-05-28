// Fluxua Bi-weekly Email Digest — Supabase Edge Function
// Triggered hourly by pg_cron. Sends a cycle digest on the 8th and 22nd of each month
// to users who opted in and whose digest_hour matches the current UTC hour.
//
// Required env vars (set in Supabase dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY   — Resend API key (resend.com)
//   FROM_EMAIL       — Sender address verified in Resend (e.g. digest@fluxua.app)
//   SUPABASE_URL     — injected automatically by Supabase runtime
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'digest@fluxua.app';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  is_autopay: boolean;
  is_variable_amount: boolean;
}

interface ExpenseRecord {
  expense_id: string;
  is_paid: boolean;
  is_waived: boolean | null;
  statement_balance: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dueThisWeek(dueDay: number, today: Date): boolean {
  const end = new Date(today);
  end.setDate(end.getDate() + 7);
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay);
  return due >= today && due < end;
}

// ─── Email HTML ───────────────────────────────────────────────────────────────

function buildHtml(opts: {
  userName: string;
  cashNeeded: { name: string; amount: number; dueDay: number }[];
  missingBalances: { name: string; dueDay: number }[];
  nonAutopay: { name: string; amount: number; dueDay: number }[];
  totalDue: number;
  totalPaid: number;
}): string {
  const { userName, cashNeeded, missingBalances, nonAutopay, totalDue, totalPaid } = opts;
  const pct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px">${label}</td><td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right">${value}</td></tr>`;

  const billRow = (name: string, day: number, amount?: number) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#374151">${name}</td><td style="padding:6px 0;font-size:13px;color:#6b7280;text-align:center">Due ${day}</td><td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right">${amount !== undefined ? '$' + fmt(amount) : '—'}</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px">

  <!-- Header -->
  <tr><td style="background:#0f172a;padding:32px;text-align:center">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:2px;text-transform:uppercase">FLUXUA</p>
    <h1 style="margin:8px 0 4px;font-size:24px;font-weight:700;color:#ffffff">Your Weekly Digest</h1>
    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55)">Hi ${userName} 👋 Here's what's coming up</p>
  </td></tr>

  <!-- Progress bar -->
  <tr><td style="padding:24px 32px 0">
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px">Month progress</p>
    <div style="background:#e5e7eb;border-radius:9999px;height:8px">
      <div style="background:#1a56db;border-radius:9999px;height:8px;width:${pct}%"></div>
    </div>
    <p style="margin:6px 0 0;font-size:13px;color:#6b7280">${pct}% covered — $${fmt(totalPaid)} paid of $${fmt(totalDue)} due this month</p>
  </td></tr>

  <!-- Cash needed this week -->
  ${cashNeeded.length > 0 ? `
  <tr><td style="padding:24px 32px 0">
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.8px">Cash needed this week</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead><tr>
        <th style="text-align:left;font-size:11px;color:#9ca3af;font-weight:600;padding-bottom:6px">Commitment</th>
        <th style="text-align:center;font-size:11px;color:#9ca3af;font-weight:600;padding-bottom:6px">Due</th>
        <th style="text-align:right;font-size:11px;color:#9ca3af;font-weight:600;padding-bottom:6px">Amount</th>
      </tr></thead>
      <tbody>${cashNeeded.map(b => billRow(b.name, b.dueDay, b.amount)).join('')}</tbody>
    </table>
  </td></tr>` : ''}

  <!-- Missing statement balances -->
  ${missingBalances.length > 0 ? `
  <tr><td style="padding:24px 32px 0">
    <div style="background:#fffbeb;border-radius:12px;padding:16px">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e">⚠️ Statement balances needed</p>
      <p style="margin:0 0 12px;font-size:12px;color:#b45309">These autopay cards fire soon — enter the balance in Fluxua</p>
      <ul style="margin:0;padding-left:16px">${missingBalances.map(b => `<li style="font-size:13px;color:#374151;padding:3px 0">${b.name} (due ${b.dueDay})</li>`).join('')}</ul>
    </div>
  </td></tr>` : ''}

  <!-- Non-autopay bills -->
  ${nonAutopay.length > 0 ? `
  <tr><td style="padding:24px 32px 0">
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.8px">Manual payments due soon</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tbody>${nonAutopay.map(b => billRow(b.name, b.dueDay, b.amount)).join('')}</tbody>
    </table>
  </td></tr>` : ''}

  <!-- Footer -->
  <tr><td style="padding:32px;border-top:1px solid #f3f4f6;margin-top:24px;text-align:center">
    <p style="margin:0;font-size:12px;color:#9ca3af">You're receiving this because you enabled weekly digests in Fluxua.</p>
    <p style="margin:8px 0 0;font-size:12px;color:#9ca3af">Open the app → Settings → Notifications to update your preferences.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

Deno.serve(async (_req) => {
  try {
    const now = new Date();
    const currentDayOfMonth = now.getUTCDate();  // 1–31
    const currentHour = now.getUTCHours();

    // Only fire on the 8th and 22nd of the month
    if (currentDayOfMonth !== 8 && currentDayOfMonth !== 22) {
      return new Response(JSON.stringify({ sent: 0, reason: 'not a digest day' }), { status: 200 });
    }

    // Fetch users whose digest is due this hour
    const { data: prefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, email_digest_hour')
      .eq('email_weekly_digest', true)
      .eq('email_digest_hour', currentHour);

    if (prefsError) throw prefsError;
    if (!prefs || prefs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    let sent = 0;

    for (const pref of prefs) {
      // Fetch user email from auth
      const { data: userData } = await supabase.auth.admin.getUserById(pref.user_id);
      const email = userData?.user?.email;
      const userName = userData?.user?.user_metadata?.display_name
        ?? userData?.user?.user_metadata?.first_name
        ?? email?.split('@')[0]
        ?? 'there';

      if (!email) continue;

      // Fetch household membership
      const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', pref.user_id)
        .maybeSingle();

      if (!membership?.household_id) continue;
      const householdId = membership.household_id;

      const month = now.getUTCMonth() + 1;
      const year = now.getUTCFullYear();

      // Fetch expenses for this household
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id, name, amount, due_day, is_autopay, is_variable_amount')
        .eq('household_id', householdId) as { data: Expense[] | null };

      const { data: records } = await supabase
        .from('expense_records')
        .select('expense_id, is_paid, is_waived, statement_balance')
        .eq('household_id', householdId)
        .eq('month', month)
        .eq('year', year) as { data: ExpenseRecord[] | null };

      const recordMap = new Map<string, ExpenseRecord>();
      (records ?? []).forEach(r => recordMap.set(r.expense_id, r));

      const cashNeeded: { name: string; amount: number; dueDay: number }[] = [];
      const missingBalances: { name: string; dueDay: number }[] = [];
      const nonAutopay: { name: string; amount: number; dueDay: number }[] = [];
      let totalDue = 0;
      let totalPaid = 0;

      for (const exp of (expenses ?? [])) {
        const rec = recordMap.get(exp.id);
        const isPaid = rec?.is_paid ?? false;
        const isWaived = rec?.is_waived ?? false;
        if (isWaived) continue;

        const amount = rec?.statement_balance ?? exp.amount;
        totalDue += amount;
        if (isPaid) {
          totalPaid += amount;
          continue;
        }

        const comingUp = dueThisWeek(exp.due_day, now);
        if (!comingUp) continue;

        if (exp.is_variable_amount && exp.is_autopay && !rec?.statement_balance) {
          missingBalances.push({ name: exp.name, dueDay: exp.due_day });
        }
        if (!exp.is_autopay) {
          nonAutopay.push({ name: exp.name, amount, dueDay: exp.due_day });
        }
        if (!exp.is_autopay || (exp.is_variable_amount && !rec?.statement_balance)) {
          cashNeeded.push({ name: exp.name, amount, dueDay: exp.due_day });
        }
      }

      const html = buildHtml({ userName, cashNeeded, missingBalances, nonAutopay, totalDue, totalPaid });

      const cycleLabel = currentDayOfMonth === 8 ? 'Cycle 1 (10–22)' : 'Cycle 2 (23–9)';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: `Fluxua transfer digest — ${cycleLabel} · ${now.toLocaleDateString('en-US', { month: 'long' })}`,
          html,
        }),
      });

      if (res.ok) sent++;
    }

    return new Response(JSON.stringify({ sent }), { status: 200 });
  } catch (err) {
    console.error('weekly-digest error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
