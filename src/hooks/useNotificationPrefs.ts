import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchNotificationPrefs, upsertNotificationPrefs } from '../services/supabase';
import { NotificationPreferences } from '../types';

const DEFAULT_PREFS: Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'> = {
  push_stmt_reminder: true,
  push_pay_3day: true,
  push_pay_today: true,
  push_autopay_warn: true,
  email_weekly_digest: false,
  email_digest_day: 0,
  email_digest_hour: 18,
};

export function useNotificationPrefs() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchNotificationPrefs(user.id);
      setPrefs(data);
    } catch {
      // silently fall back to defaults
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(
    async (updates: Partial<Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user) return;
      // Optimistic update
      setPrefs(prev => prev
        ? { ...prev, ...updates }
        : { user_id: user.id, created_at: '', updated_at: '', ...DEFAULT_PREFS, ...updates }
      );
      try {
        const saved = await upsertNotificationPrefs(user.id, updates);
        setPrefs(saved);
      } catch {
        // revert on failure
        load();
      }
    },
    [user, load]
  );

  const effective = prefs ?? { user_id: user?.id ?? '', created_at: '', updated_at: '', ...DEFAULT_PREFS };

  return { prefs: effective, loading, update };
}
