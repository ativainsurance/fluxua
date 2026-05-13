import React from 'react';
import {
  View,
  Text,
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

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'PrivacyPolicy'>;

const LAST_UPDATED = 'May 1, 2025';

interface PolicySection {
  title: string;
  icon: string;
  content: string[];
}

const SECTIONS: PolicySection[] = [
  {
    title: '1. Introduction',
    icon: 'document-text-outline',
    content: [
      'Welcome to Fluxua. We are committed to protecting your personal information and your right to privacy.',
      'This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this policy carefully. If you disagree with its terms, please discontinue use of the application.',
      'We reserve the right to make changes to this policy at any time. We will notify you of material changes by updating the "Last Updated" date.',
    ],
  },
  {
    title: '2. Information We Collect',
    icon: 'layers-outline',
    content: [
      'Account Information: When you register, we collect your email address and any profile details you choose to provide, such as your name and account type (personal or business).',
      'Financial Commitment Data: The bills, subscriptions, and recurring expenses you enter into Fluxua. This data is stored securely in your personal account and is never shared or sold.',
      'Usage Data: We may collect information about how you interact with the app to improve functionality. This includes feature usage patterns, but never the content of your financial data.',
      'Device Information: Basic device data such as operating system version may be collected for compatibility and debugging purposes.',
    ],
  },
  {
    title: '3. How We Use Your Information',
    icon: 'settings-outline',
    content: [
      'To provide and maintain the Fluxua service, including account authentication and data synchronization across devices.',
      'To send you transactional communications such as email verification, password reset, and important account notices.',
      'To improve, personalize, and expand our services based on aggregate, anonymized usage patterns.',
      'We do not sell, trade, or rent your personal information to third parties. We do not use your financial commitment data for advertising.',
    ],
  },
  {
    title: '4. Data Security',
    icon: 'shield-checkmark-outline',
    content: [
      'We use Supabase as our backend infrastructure, which provides enterprise-grade security including row-level security (RLS) — your data is cryptographically isolated from all other users.',
      'All data is encrypted in transit using TLS 1.2 or higher. Data at rest is encrypted using AES-256.',
      'We implement access controls, audit logging, and regular security reviews. No system is 100% secure, but we take meaningful steps to protect your information.',
      'We do not store payment card numbers, bank account credentials, or any raw financial instrument data.',
    ],
  },
  {
    title: '5. Your Rights',
    icon: 'person-circle-outline',
    content: [
      'Access: You may request a copy of all personal data we hold about you at any time.',
      'Correction: You can update your account information directly within the app at any time via Settings → Personal Details.',
      'Deletion: You have the right to request deletion of your account and all associated data. This action is permanent and irreversible.',
      'Portability: You may request an export of your commitment data in a standard format.',
      'To exercise any of these rights, contact us at privacy@fluxua.app.',
    ],
  },
  {
    title: '6. Data Retention',
    icon: 'time-outline',
    content: [
      'We retain your data for as long as your account is active or as needed to provide services.',
      'If you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain it by law.',
      'Anonymized, aggregated data may be retained indefinitely for analytical purposes.',
    ],
  },
  {
    title: '7. Third-Party Services',
    icon: 'share-outline',
    content: [
      'Supabase (supabase.com): Our backend provider for authentication and database. Subject to Supabase\'s privacy policy.',
      'Expo (expo.dev): Our application framework, used for app distribution and updates.',
      'We do not integrate with advertising networks, data brokers, or analytics services that have access to personally identifiable information.',
    ],
  },
  {
    title: '8. Children\'s Privacy',
    icon: 'happy-outline',
    content: [
      'Fluxua is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children.',
      'If you become aware that a child has provided personal information, please contact us so we can take appropriate action.',
    ],
  },
  {
    title: '9. Contact Us',
    icon: 'mail-outline',
    content: [
      'If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:',
      'Email: privacy@fluxua.app',
      'We aim to respond to all privacy inquiries within 5 business days.',
    ],
  },
];

const PolicySection = ({ section }: { section: PolicySection }) => (
  <View style={ps.wrapper}>
    <View style={ps.titleRow}>
      <View style={ps.iconWrap}>
        <Ionicons name={section.icon as any} size={16} color={colors.primary} />
      </View>
      <Text style={ps.title}>{section.title}</Text>
    </View>
    <View style={ps.content}>
      {section.content.map((para, i) => (
        <Text key={i} style={ps.para}>{para}</Text>
      ))}
    </View>
  </View>
);

const ps = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.textPrimary, flex: 1 },
  content: { paddingLeft: 28 + spacing.sm, gap: 8 },
  para: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: 22 },
});

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={s.safe}>
      <SubScreenHeader title="Privacy Policy" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header card ── */}
        <View style={s.headerCard}>
          <View style={s.headerIcon}>
            <Ionicons name="lock-closed" size={24} color={colors.primary} />
          </View>
          <Text style={s.headerTitle}>Privacy Policy</Text>
          <Text style={s.headerSub}>Last updated: {LAST_UPDATED}</Text>
          <Text style={s.headerNote}>
            Your data belongs to you. We built Fluxua with privacy as a core value, not an afterthought.
          </Text>
        </View>

        {/* ── Sections ── */}
        <View style={s.sectionsCard}>
          {SECTIONS.map((section, i) => (
            <React.Fragment key={section.title}>
              {i > 0 && <View style={s.sectionDivider} />}
              <PolicySection section={section} />
            </React.Fragment>
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            © {new Date().getFullYear()} Fluxua · All rights reserved.
          </Text>
          <Text style={s.footerSub}>privacy@fluxua.app</Text>
        </View>
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

  // ── Header card ──
  headerCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.hero,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: '#fff',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: typography.xs,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
  },
  headerNote: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  // ── Sections card ──
  sectionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.card,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  // ── Footer ──
  footer: { alignItems: 'center', gap: 3, paddingTop: spacing.xs },
  footerText: { fontSize: typography.xs, color: colors.textDisabled },
  footerSub: { fontSize: 10, color: colors.textDisabled, opacity: 0.7 },
});
