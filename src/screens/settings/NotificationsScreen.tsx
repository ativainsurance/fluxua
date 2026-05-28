import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { typography, spacing, radius, shadows } from '../../theme';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotificationPrefs } from '../../hooks/useNotificationPrefs';
import { NotificationPreferences } from '../../types';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Notifications'>;

// ─────────────────────────────────────────────
// Toggle row
// ─────────────────────────────────────────────

interface ToggleRowProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isFirst?: boolean;
  disabled?: boolean;
}

const ToggleRow = ({ icon, iconColor, iconBg, label, description, value, onChange, isFirst, disabled }: ToggleRowProps) => {
  const { colors } = useTheme();
  return (
    <>
      {!isFirst && <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: spacing.base + 40 + spacing.md }} />}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.base, paddingVertical: 14, gap: spacing.md, opacity: disabled ? 0.45 : 1 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 }}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary }}>{label}</Text>
          <Text style={{ fontSize: typography.xs, color: colors.textSecondary, lineHeight: 17 }} numberOfLines={2}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: colors.teal }}
          thumbColor={colors.textInverse}
          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }], flexShrink: 0 }}
          disabled={disabled}
        />
      </View>
    </>
  );
};

// ─────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: spacing.xs, marginBottom: 2 }}>{label}</Text>
      <View style={{ borderRadius: radius.xl, overflow: 'hidden', ...shadows.card, backgroundColor: colors.surface }}>{children}</View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Day picker
// ─────────────────────────────────────────────

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const DigestDayPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (d: number) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.base, paddingVertical: spacing.md, flexWrap: 'wrap' }}>
      {DAY_KEYS.map((key, idx) => {
        const selected = value === idx;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onChange(idx)}
            style={{
              flex: 1,
              minWidth: 36,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              alignItems: 'center',
              backgroundColor: selected ? colors.primary : colors.surfaceAlt,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: selected ? colors.textInverse : colors.textSecondary }}>
              {t(`notifications.days.${key}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────────
// Hour picker (simplified row of AM/PM options)
// ─────────────────────────────────────────────

const HOUR_OPTIONS = [9, 12, 15, 18, 21] as const;

const DigestHourPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (h: number) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.base, paddingBottom: spacing.md, flexWrap: 'wrap' }}>
      {HOUR_OPTIONS.map(h => {
        const selected = value === h;
        const label = t(`notifications.hour_${h}`);
        return (
          <TouchableOpacity
            key={h}
            onPress={() => onChange(h)}
            style={{
              flex: 1,
              minWidth: 50,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              alignItems: 'center',
              backgroundColor: selected ? colors.primary : colors.surfaceAlt,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: selected ? colors.textInverse : colors.textSecondary }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { prefs, loading, update } = useNotificationPrefs();

  const activeCount = [
    prefs.push_stmt_reminder,
    prefs.push_pay_3day,
    prefs.push_pay_today,
    prefs.push_autopay_warn,
    prefs.email_weekly_digest,
  ].filter(Boolean).length;

  const set = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => update({ [key]: value } as any);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SubScreenHeader title={t('notifications.title')} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xxxl, gap: spacing.base }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadows.card }}>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.warningLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
            {loading
              ? <ActivityIndicator size="small" color={colors.warning} />
              : <Ionicons name="notifications" size={22} color={colors.warning} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: colors.textPrimary }}>
              {t('notifications.activeCount', { count: activeCount })}
            </Text>
            <Text style={{ fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 }}>
              {t('notifications.stayInformed')}
            </Text>
          </View>
        </View>

        {/* Push notifications */}
        <Section label={t('notifications.sectionPush')}>
          <ToggleRow
            icon="card-outline"
            iconColor={colors.warning}
            iconBg={colors.warningLight}
            label={t('notifications.stmtReminderLabel')}
            description={t('notifications.stmtReminderDesc')}
            value={prefs.push_stmt_reminder}
            onChange={v => set('push_stmt_reminder', v)}
            isFirst
          />
          <ToggleRow
            icon="time-outline"
            iconColor={colors.danger}
            iconBg={colors.dangerLight}
            label={t('notifications.pay3dayLabel')}
            description={t('notifications.pay3dayDesc')}
            value={prefs.push_pay_3day}
            onChange={v => set('push_pay_3day', v)}
          />
          <ToggleRow
            icon="alarm-outline"
            iconColor={colors.danger}
            iconBg={colors.dangerLight}
            label={t('notifications.payTodayLabel')}
            description={t('notifications.payTodayDesc')}
            value={prefs.push_pay_today}
            onChange={v => set('push_pay_today', v)}
          />
          <ToggleRow
            icon="warning-outline"
            iconColor={colors.business}
            iconBg={colors.businessLight}
            label={t('notifications.autopayWarnLabel')}
            description={t('notifications.autopayWarnDesc')}
            value={prefs.push_autopay_warn}
            onChange={v => set('push_autopay_warn', v)}
          />
        </Section>

        {/* Email digest */}
        <Section label={t('notifications.sectionEmail')}>
          <ToggleRow
            icon="mail-outline"
            iconColor={colors.teal}
            iconBg={colors.tealLight}
            label={t('notifications.emailDigestLabel')}
            description={t('notifications.emailDigestDesc')}
            value={prefs.email_weekly_digest}
            onChange={v => set('email_weekly_digest', v)}
            isFirst
          />
          {prefs.email_weekly_digest && (
            <>
              <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: spacing.base + 40 + spacing.md }} />
              <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: spacing.base, paddingTop: spacing.md }}>
                {t('notifications.digestDay')}
              </Text>
              <DigestDayPicker value={prefs.email_digest_day} onChange={d => set('email_digest_day', d)} />
              <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: spacing.base }}>
                {t('notifications.digestTime')}
              </Text>
              <DigestHourPicker value={prefs.email_digest_hour} onChange={h => set('email_digest_hour', h)} />
            </>
          )}
        </Section>

        {/* iOS permission note */}
        {Platform.OS === 'ios' && (
          <Text style={{ fontSize: typography.xs, color: colors.textTertiary, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.sm }}>
            {t('notifications.permissionNote')}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
