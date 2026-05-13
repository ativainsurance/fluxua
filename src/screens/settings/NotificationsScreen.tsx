import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, typography, spacing, radius, shadows } from '../../theme';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Notifications'>;

interface ToggleItem {
  key: string;
  label: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

const ToggleRow = ({
  item,
  value,
  onChange,
  isFirst,
  isLast,
}: {
  item: ToggleItem;
  value: boolean;
  onChange: (v: boolean) => void;
  isFirst: boolean;
  isLast: boolean;
}) => (
  <>
    {!isFirst && <View style={divS.line} />}
    <View style={[tr.row, isFirst && tr.rowFirst, isLast && tr.rowLast]}>
      <View style={[tr.iconWrap, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
      </View>
      <View style={tr.info}>
        <Text style={tr.label}>{item.label}</Text>
        <Text style={tr.desc} numberOfLines={2}>{item.description}</Text>
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

const divS = StyleSheet.create({
  line: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.base + 40 + spacing.md },
});

const tr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  rowFirst: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  rowLast: { borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  info: { flex: 1, gap: 3 },
  label: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary },
  desc: { fontSize: typography.xs, color: colors.textSecondary, lineHeight: 17 },
});

// ── Section data ──
const PUSH_ITEMS: ToggleItem[] = [
  {
    key: 'paymentReminders',
    label: 'Payment Reminders',
    description: 'Remind me before a commitment is due',
    icon: 'alarm-outline',
    iconColor: colors.warning,
    iconBg: colors.warningLight,
  },
  {
    key: 'dueSoon',
    label: 'Due Soon Alerts',
    description: "Alert me when bills are within 3 days of due date",
    icon: 'time-outline',
    iconColor: colors.danger,
    iconBg: colors.dangerLight,
  },
  {
    key: 'overdue',
    label: 'Overdue Notifications',
    description: 'Notify me when a commitment is past due',
    icon: 'alert-circle-outline',
    iconColor: '#EF4444',
    iconBg: '#FEF2F2',
  },
];

const SUMMARY_ITEMS: ToggleItem[] = [
  {
    key: 'weeklySummary',
    label: 'Weekly Summary',
    description: 'A snapshot of your week every Monday morning',
    icon: 'stats-chart-outline',
    iconColor: colors.primary,
    iconBg: colors.primaryLight,
  },
  {
    key: 'monthlySummary',
    label: 'Monthly Summary',
    description: 'Full monthly report on the 1st of each month',
    icon: 'calendar-outline',
    iconColor: colors.personal,
    iconBg: colors.personalLight,
  },
];

const EMAIL_ITEMS: ToggleItem[] = [
  {
    key: 'emailDigests',
    label: 'Email Digests',
    description: 'Receive summaries via email instead of push',
    icon: 'mail-outline',
    iconColor: colors.teal,
    iconBg: colors.tealLight,
  },
  {
    key: 'productUpdates',
    label: 'Product Updates',
    description: "New features, tips, and Fluxua news",
    icon: 'megaphone-outline',
    iconColor: colors.business,
    iconBg: colors.businessLight,
  },
];

type PrefsState = Record<string, boolean>;

const DEFAULT: PrefsState = {
  paymentReminders: true,
  dueSoon: true,
  overdue: true,
  weeklySummary: false,
  monthlySummary: false,
  emailDigests: false,
  productUpdates: false,
};

const NotifSection = ({
  label,
  items,
  prefs,
  toggle,
}: {
  label: string;
  items: ToggleItem[];
  prefs: PrefsState;
  toggle: (key: string) => void;
}) => (
  <View style={ns.wrapper}>
    <Text style={ns.label}>{label}</Text>
    <View style={ns.card}>
      {items.map((item, i) => (
        <ToggleRow
          key={item.key}
          item={item}
          value={prefs[item.key] ?? false}
          onChange={() => toggle(item.key)}
          isFirst={i === 0}
          isLast={i === items.length - 1}
        />
      ))}
    </View>
  </View>
);

const ns = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
    marginBottom: 2,
  },
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
});

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const [prefs, setPrefs] = useState<PrefsState>(DEFAULT);

  const toggle = (key: string) =>
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const activeCount = Object.values(prefs).filter(Boolean).length;

  return (
    <SafeAreaView style={s.safe}>
      <SubScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status summary ── */}
        <View style={s.summaryCard}>
          <View style={[s.summaryIcon, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="notifications" size={22} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.summaryTitle}>{activeCount} notification{activeCount !== 1 ? 's' : ''} active</Text>
            <Text style={s.summarySub}>Stay informed about your commitments</Text>
          </View>
        </View>

        <NotifSection label="Push Notifications" items={PUSH_ITEMS} prefs={prefs} toggle={toggle} />
        <NotifSection label="Summaries" items={SUMMARY_ITEMS} prefs={prefs} toggle={toggle} />
        <NotifSection label="Email" items={EMAIL_ITEMS} prefs={prefs} toggle={toggle} />

        <Text style={s.footnote}>
          Notification delivery depends on your device settings. Ensure Fluxua has permission to send notifications.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl,
    gap: spacing.base,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  summaryTitle: { fontSize: typography.base, fontWeight: typography.bold, color: colors.textPrimary },
  summarySub: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  footnote: {
    fontSize: typography.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
});
