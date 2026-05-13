import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { typography, spacing, radius, shadows } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'HelpFaq'>;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FaqItem { q: string; a: string; }
interface FaqSection {
  title: string; icon: string; iconColor: string;
  iconBgKey: 'primary' | 'teal' | 'personal' | 'warning'; items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Getting Started', icon: 'rocket-outline', iconColor: '#3B82F6', iconBgKey: 'primary',
    items: [
      { q: 'What is Fluxua?', a: 'Fluxua is a commitment tracker — not a traditional expense logger. It helps you track recurring bills, subscriptions, and financial obligations so nothing slips through the cracks.' },
      { q: "What's the difference between Flow and Commitments?", a: 'Commitments is where you manage your full list of bills and recurring obligations. Flow is your weekly view — it shows how your commitments break down into the current week so you can stay on top of cash flow in real time.' },
      { q: 'How do I add a commitment?', a: "Tap the + button on the Commitments screen. Fill in the name, amount, due date, and whether it's recurring. You can also set it as personal or business, and add autopay details." },
    ],
  },
  {
    title: 'Commitments & Bills', icon: 'receipt-outline', iconColor: '#14B8A6', iconBgKey: 'teal',
    items: [
      { q: 'What does "Waived" mean?', a: '"Waived" means a commitment is resolved at $0 for that month — perhaps a fee was forgiven, a subscription was comped, or someone else covered it. It counts as resolved without requiring payment.' },
      { q: 'Can I remove a commitment from just one month?', a: "Yes. Long-press any commitment card and select \"Remove from this month.\" The commitment will stay on your list for future months but won't appear in the current period." },
      { q: 'What does the weekly allocation show?', a: "The weekly allocation divides a bill's amount by the weeks remaining in the month, giving you a sense of how much you need to set aside each week to be ready when it's due." },
      { q: 'How do I mark a bill as paid with a different amount?', a: 'Tap the checkmark on any commitment card — a modal will appear letting you enter the actual amount paid, any late fees, and credits applied.' },
    ],
  },
  {
    title: 'Account & Security', icon: 'shield-checkmark-outline', iconColor: '#6366F1', iconBgKey: 'personal',
    items: [
      { q: 'How do I change my email?', a: "Go to Settings → Email. You'll be asked to confirm your current password, then enter the new email. A verification link will be sent to your new address before the change takes effect." },
      { q: 'How do I reset my password?', a: "On the login screen, tap \"Forgot Password.\" Enter your email and we'll send a reset link. For security, the link expires after 15 minutes." },
      { q: 'Is my financial data secure?', a: 'Yes. Fluxua uses Supabase with row-level security, meaning your data is isolated per user and encrypted at rest. We never store actual bank credentials.' },
    ],
  },
  {
    title: 'Troubleshooting', icon: 'construct-outline', iconColor: '#F59E0B', iconBgKey: 'warning',
    items: [
      { q: "My commitments aren't showing up for this month.", a: "Check that the commitment's start and end dates include the current month. Also verify it's marked as recurring. If it was excluded from this month, you'll need to re-add it." },
      { q: 'The app is showing the wrong currency format.', a: 'Go to Settings → Currency and select your preferred currency. The format will update across the entire app.' },
      { q: 'I accidentally deleted a commitment. Can I undo it?', a: "Deleted commitments cannot currently be restored. We recommend using \"Remove from this month\" instead of deleting permanently unless you're sure you no longer need the commitment." },
    ],
  },
];

const AccordionItem = ({ item, isFirst, isLast }: { item: FaqItem; isFirst: boolean; isLast: boolean }) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const toggle = () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(v => !v); };
  return (
    <>
      {!isFirst && <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: spacing.base }} />}
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.base, paddingVertical: 14, gap: spacing.sm, backgroundColor: colors.surface, borderTopLeftRadius: isFirst ? radius.xl : 0, borderTopRightRadius: isFirst ? radius.xl : 0, borderBottomLeftRadius: isLast && !open ? radius.xl : 0, borderBottomRightRadius: isLast && !open ? radius.xl : 0 }}
        onPress={toggle} activeOpacity={0.75}>
        <Text style={{ flex: 1, fontSize: typography.sm, fontWeight: typography.semibold, color: open ? colors.primary : colors.textPrimary, lineHeight: 20 }}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={open ? colors.primary : colors.textTertiary} />
      </TouchableOpacity>
      {open && (
        <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomLeftRadius: isLast ? radius.xl : 0, borderBottomRightRadius: isLast ? radius.xl : 0 }}>
          <Text style={{ fontSize: typography.sm, color: colors.textSecondary, lineHeight: 22 }}>{item.a}</Text>
        </View>
      )}
    </>
  );
};

const FaqSectionCard = ({ section }: { section: FaqSection }) => {
  const { colors } = useTheme();
  const BG_MAP = { primary: colors.primaryLight, teal: colors.tealLight, personal: colors.personalLight, warning: colors.warningLight };
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs }}>
        <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: BG_MAP[section.iconBgKey], justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={section.icon as any} size={16} color={section.iconColor} />
        </View>
        <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' }}>{section.title}</Text>
      </View>
      <View style={{ borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surface, ...shadows.card }}>
        {section.items.map((item, i) => (
          <AccordionItem key={i} item={item} isFirst={i === 0} isLast={i === section.items.length - 1} />
        ))}
      </View>
    </View>
  );
};

export default function HelpFaqScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SubScreenHeader title="Help & FAQ" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xxxl, gap: spacing.base }} showsVerticalScrollIndicator={false}>

        <View style={{ backgroundColor: colors.businessLight, borderRadius: radius.xl, padding: spacing.base, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.business }}>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.businessLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
            <Ionicons name="help-buoy-outline" size={28} color={colors.business} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.md, fontWeight: typography.bold, color: colors.textPrimary }}>How can we help?</Text>
            <Text style={{ fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 }}>Find answers to common questions below</Text>
          </View>
        </View>

        {FAQ_SECTIONS.map(section => <FaqSectionCard key={section.title} section={section} />)}

        <View style={{ backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md, ...shadows.hero }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.teal} />
            <Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: '#fff' }}>Still need help?</Text>
          </View>
          <Text style={{ fontSize: typography.sm, color: 'rgba(255,255,255,0.6)', lineHeight: 20 }}>Can't find your answer? Send us a message and we'll get back to you within 24 hours.</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 12, shadowColor: colors.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 3 }} activeOpacity={0.8}>
            <Ionicons name="mail-outline" size={16} color="#fff" />
            <Text style={{ fontSize: typography.sm, fontWeight: typography.bold, color: '#fff' }}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
