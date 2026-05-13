import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { typography, spacing, radius, shadows } from '../../theme';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Notifications'>;

interface ToggleItem {
  key: string;
  label: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

// Static color values (brand palette – not theme-dependent for icons)
const PUSH_ITEMS: ToggleItem[] = [
  { key: 'paymentReminders', label: 'Payment Reminders', description: 'Remind me before a commitment is due', icon: 'alarm-outline', iconColor: '#F59E0B', iconBg: '#FEF3C7' },
  { key: 'dueSoon', label: 'Due Soon Alerts', description: 'Alert me when bills are within 3 days of due date', icon: 'time-outline', iconColor: '#EF4444', iconBg: '#FEE2E2' },
  { key: 'overdue', label: 'Overdue Notifications', description: 'Notify me when a commitment is past due', icon: 'alert-circle-outline', iconColor: '#EF4444', iconBg: '#FEF2F2' },
];

const SUMMARY_ITEMS: ToggleItem[] = [
  { key: 'weeklySummary', label: 'Weekly Summary', description: 'A snapshot of your week every Monday morning', icon: 'stats-chart-outline', iconColor: '#3B82F6', iconBg: '#EFF6FF' },
  { key: 'monthlySummary', label: 'Monthly Summary', description: 'Full monthly report on the 1st of each month', icon: 'calendar-outline', iconColor: '#8B5CF6', iconBg: '#F5F3FF' },
];

const EMAIL_ITEMS: ToggleItem[] = [
  { key: 'emailDigests', label: 'Email Digests', description: 'Receive summaries via email instead of push', icon: 'mail-outline', iconColor: '#14B8A6', iconBg: '#F0FDFA' },
  { key: 'productUpdates', label: 'Product Updates', description: 'New features, tips, and Fluxua news', icon: 'megaphone-outline', iconColor: '#6366F1', iconBg: '#EEF2FF' },
];

type PrefsState = Record<string, boolean>;

const DEFAULT: PrefsState = {
  paymentReminders: true, dueSoon: true, overdue: true,
  weeklySummary: false, monthlySummary: false, emailDigests: false, productUpdates: false,
};

const ToggleRow = ({ item, value, onChange, isFirst }: {
  item: ToggleItem; value: boolean; onChange: (v: boolean) => void; isFirst: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <>
      {!isFirst && <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: spacing.base + 40 + spacing.md }} />}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.base, paddingVertical: 14, gap: spacing.md, backgroundColor: colors.surface }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.iconBg, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 }}>
          <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary }}>{item.label}</Text>
          <Text style={{ fontSize: typography.xs, color: colors.textSecondary, lineHeight: 17 }} numberOfLines={2}>{item.description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: colors.teal }}
          thumbColor="#fff"
          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }], flexShrink: 0 }}
        />
      </View>
    </>
  );
};

const NotifSection = ({ label, items, prefs, toggle }: {
  label: string; items: ToggleItem[]; prefs: PrefsState; toggle: (key: string) => void;
}) => {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: spacing.xs, marginBottom: 2 }}>{label}</Text>
      <View style={{ borderRadius: radius.xl, overflow: 'hidden', ...shadows.card }}>
        {items.map((item, i) => (
          <ToggleRow
            key={item.key}
            item={item}
            value={prefs[item.key] ?? false}
            onChange={() => toggle(item.key)}
            isFirst={i === 0}
          />
        ))}
      </View>
    </View>
  );
};

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [prefs, setPrefs] = useState<PrefsState>(DEFAULT);

  const toggle = (key: string) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  const activeCount = Object.values(prefs).filter(Boolean).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SubScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xxxl, gap: spacing.base }} showsVerticalScrollIndicator={false}>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadows.card }}>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.warningLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
            <Ionicons name="notifications" size={22} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: colors.textPrimary }}>{activeCount} notification{activeCount !== 1 ? 's' : ''} active</Text>
            <Text style={{ fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 }}>Stay informed about your commitments</Text>
          </View>
        </View>

        <NotifSection label="Push Notifications" items={PUSH_ITEMS} prefs={prefs} toggle={toggle} />
        <NotifSection label="Summaries" items={SUMMARY_ITEMS} prefs={prefs} toggle={toggle} />
        <NotifSection label="Email" items={EMAIL_ITEMS} prefs={prefs} toggle={toggle} />

        <Text style={{ fontSize: typography.xs, color: colors.textTertiary, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.sm }}>
          Notification delivery depends on your device settings. Ensure Fluxua has permission to send notifications.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
