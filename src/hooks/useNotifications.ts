import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { buildScheduledNotifications } from '../utils/notificationScheduler';
import { Expense, ExpenseRecord, NotificationPreferences } from '../types';

const PERMISSION_ASKED_KEY = '@fluxua/notif_permission_asked';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Returns true if the OS has granted notification permission */
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

/** Requests OS permission; returns true if granted */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await AsyncStorage.setItem(PERMISSION_ASKED_KEY, '1');
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Returns true if we have not yet shown the OS permission prompt */
export async function hasNeverAskedPermission(): Promise<boolean> {
  const val = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);
  return val === null;
}

interface UseNotificationsOptions {
  expenses: Expense[];
  records: ExpenseRecord[];
  prefs: NotificationPreferences;
  userId: string;
  month: number;
  year: number;
  enabled: boolean;
}

/**
 * Cancel-and-reschedule all Fluxua notifications whenever data changes.
 * Call this hook once at app root or in the main data hook.
 */
export function useNotificationScheduler(opts: UseNotificationsOptions) {
  const { expenses, records, prefs, userId, month, year, enabled } = opts;
  const { t } = useTranslation();

  const schedule = useCallback(async () => {
    if (!enabled || Platform.OS === 'web') return;

    const status = await getNotificationPermissionStatus();
    if (status !== 'granted') return;

    // Cancel all previously scheduled Fluxua notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const fluxuaIds = scheduled
      .filter(n => n.identifier.startsWith('fluxua-'))
      .map(n => n.identifier);
    await Promise.all(fluxuaIds.map(id => Notifications.cancelScheduledNotificationAsync(id)));

    const strings = {
      stmtReminderTitle: t('notifications.stmtReminderTitle'),
      stmtReminderBody: (name: string) => t('notifications.stmtReminderBody', { name }),
      pay3dayTitle: t('notifications.pay3dayTitle'),
      pay3dayBody: (name: string) => t('notifications.pay3dayBody', { name }),
      payTodayTitle: t('notifications.payTodayTitle'),
      payTodayBody: (name: string) => t('notifications.payTodayBody', { name }),
      autopayWarnTitle: t('notifications.autopayWarnTitle'),
      autopayWarnBody: (name: string) => t('notifications.autopayWarnBody', { name }),
    };

    const notifs = buildScheduledNotifications({ expenses, records, prefs, userId, month, year, strings });

    await Promise.all(
      notifs.map(n =>
        Notifications.scheduleNotificationAsync({
          identifier: n.identifier,
          content: n.content,
          trigger: n.trigger,
        })
      )
    );
  }, [enabled, expenses, records, prefs, userId, month, year, t]);

  useEffect(() => {
    schedule();
  }, [schedule]);
}

/** Register a listener that handles notification taps (deep-link routing) */
export function useNotificationResponseListener(
  onResponse: (data: Record<string, unknown>) => void
) {
  const listenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    listenerRef.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      onResponse(data);
    });
    return () => {
      listenerRef.current?.remove();
    };
  }, [onResponse]);
}
