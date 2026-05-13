import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { SettingsStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

// ─────────────────────────────────────────────
// Row component — icon · label · right element
// ─────────────────────────────────────────────

type RowRight =
  | { type: 'chevron' }
  | { type: 'value'; text: string }
  | { type: 'toggle'; value: boolean; onChange: (v: boolean) => void }
  | { type: 'badge'; text: string; color: string };

const SettingsRow = ({
  icon,
  iconColor,
  iconBg,
  label,
  right,
  onPress,
  danger = false,
  isFirst = false,
  isLast = false,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  right?: RowRight;
  onPress?: () => void;
  danger?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) => {
  const labelColor = danger ? colors.danger : colors.textPrimary;

  const rightEl = () => {
    if (!right) return null;
    switch (right.type) {
      case 'chevron':
        return (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={danger ? colors.danger : colors.textDisabled}
          />
        );
      case 'value':
        return <Text style={rowS.valueText} numberOfLines={1}>{right.text}</Text>;
      case 'toggle':
        return (
          <Switch
            value={right.value}
            onValueChange={right.onChange}
            trackColor={{ false: colors.border, true: colors.teal }}
            thumbColor="#fff"
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
          />
        );
      case 'badge':
        return (
          <View style={[rowS.badge, { backgroundColor: right.color + '18' }]}>
            <Text style={[rowS.badgeText, { color: right.color }]}>{right.text}</Text>
          </View>
        );
    }
  };

  return (
    <>
      {!isFirst && <View style={rowS.divider} />}
      <TouchableOpacity
        style={rowS.row}
        onPress={onPress}
        activeOpacity={onPress ? 0.60 : 1}
        disabled={!onPress}
      >
        <View style={[rowS.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={[rowS.label, { color: labelColor }]}>{label}</Text>
        <View style={rowS.rightSlot}>{rightEl()}</View>
      </TouchableOpacity>
    </>
  );
};

const rowS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.base + 36 + spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.textPrimary,
  },
  rightSlot: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    maxWidth: 150,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
});

// ─────────────────────────────────────────────
// Section group — floating card with label
// ─────────────────────────────────────────────

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View style={secS.wrapper}>
    <Text style={secS.label}>{label}</Text>
    <View style={secS.card}>{children}</View>
  </View>
);

const secS = StyleSheet.create({
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
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
});

// ─────────────────────────────────────────────
// SettingsScreen
// ─────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [notificationsOn, setNotificationsOn] = useState(true);

  const handleSignOut = async () => {
    setSignOutError('');
    setLoading(true);
    try {
      await signOut();
    } catch {
      setSignOutError('Failed to sign out. Try again.');
      setLoading(false);
    }
  };

  const emailDisplay = user?.email ?? '';
  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const displayName = meta.display_name ?? meta.first_name ?? emailDisplay.split('@')[0] ?? 'User';
  const currency = meta.currency ?? 'USD';
  const language = meta.language === 'pt' ? 'Portuguese' : meta.language === 'es' ? 'Spanish' : 'English';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Screen title ── */}
        <View style={s.header}>
          <Text style={s.title}>Settings</Text>
        </View>

        {/* ── Premium Profile Card ── */}
        <TouchableOpacity
          style={s.profileCard}
          onPress={() => navigation.navigate('PersonalDetails')}
          activeOpacity={0.88}
        >
          <View style={s.profileGlowA} />
          <View style={s.profileGlowB} />
          <View style={s.profileRing} />

          <View style={s.profileContent}>
            {/* Avatar with ring */}
            <View style={s.avatarRing}>
              <View style={s.avatarInner}>
                <Text style={s.avatarInitial}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={s.profileText}>
              <Text style={s.profileName}>{displayName}</Text>
              <Text style={s.profileEmail} numberOfLines={1}>{emailDisplay}</Text>
              <View style={s.profileBadgeRow}>
                <View style={s.profileBadgeDot} />
                <Text style={s.profileBadgeLabel}>Personal &amp; Business</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </View>
        </TouchableOpacity>

        {/* ── Account ── */}
        <Section label="Account">
          <SettingsRow
            icon="person-outline"
            iconColor={colors.primary}
            iconBg={colors.primaryLight}
            label="Personal Details"
            right={{ type: 'chevron' }}
            onPress={() => navigation.navigate('PersonalDetails')}
            isFirst
          />
          <SettingsRow
            icon="mail-outline"
            iconColor={colors.primary}
            iconBg={colors.primaryLight}
            label="Email"
            right={{ type: 'value', text: emailDisplay }}
            onPress={() => navigation.navigate('Email')}
          />
          <SettingsRow
            icon="shield-outline"
            iconColor={colors.personal}
            iconBg={colors.personalLight}
            label="Security"
            right={{ type: 'chevron' }}
            onPress={() => navigation.navigate('Security')}
            isLast
          />
        </Section>

        {/* ── Preferences ── */}
        <Section label="Preferences">
          <SettingsRow
            icon="notifications-outline"
            iconColor={colors.warning}
            iconBg={colors.warningLight}
            label="Notifications"
            right={{
              type: 'toggle',
              value: notificationsOn,
              onChange: (v) => {
                setNotificationsOn(v);
                navigation.navigate('Notifications');
              },
            }}
            onPress={() => navigation.navigate('Notifications')}
            isFirst
          />
          <SettingsRow
            icon="cash-outline"
            iconColor={colors.success}
            iconBg={colors.successLight}
            label="Currency"
            right={{ type: 'value', text: currency }}
            onPress={() => navigation.navigate('Currency')}
          />
          <SettingsRow
            icon="language-outline"
            iconColor={colors.teal}
            iconBg={colors.tealLight}
            label="Language"
            right={{ type: 'value', text: language }}
            onPress={() => navigation.navigate('Language')}
            isLast
          />
        </Section>

        {/* ── Support ── */}
        <Section label="Support">
          <SettingsRow
            icon="help-circle-outline"
            iconColor={colors.business}
            iconBg={colors.businessLight}
            label="Help &amp; FAQ"
            right={{ type: 'chevron' }}
            onPress={() => navigation.navigate('HelpFaq')}
            isFirst
          />
          <SettingsRow
            icon="lock-closed-outline"
            iconColor={colors.textSecondary}
            iconBg={colors.surfaceAlt}
            label="Privacy Policy"
            right={{ type: 'chevron' }}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <SettingsRow
            icon="star-outline"
            iconColor="#F59E0B"
            iconBg="#FFFBEB"
            label="Rate Fluxua"
            right={{ type: 'badge', text: 'NEW', color: colors.teal }}
            onPress={() => {}}
            isLast
          />
        </Section>

        {/* ── App ── */}
        <Section label="App">
          <SettingsRow
            icon="information-circle-outline"
            iconColor={colors.textSecondary}
            iconBg={colors.surfaceAlt}
            label="App Version"
            right={{ type: 'value', text: '1.0.0' }}
            isFirst
            isLast
          />
        </Section>

        {/* ── Sign Out ── */}
        <View style={s.signOutSection}>
          {!confirmSignOut ? (
            <TouchableOpacity
              style={s.signOutRow}
              onPress={() => setConfirmSignOut(true)}
              activeOpacity={0.7}
            >
              <View style={[s.signOutIcon]}>
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              </View>
              <Text style={s.signOutLabel}>Log Out</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.danger} />
            </TouchableOpacity>
          ) : (
            <View style={s.confirmBox}>
              <View style={s.confirmTop}>
                <View style={[s.signOutIcon]}>
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                </View>
                <View>
                  <Text style={s.confirmTitle}>Sign out of Fluxua?</Text>
                  <Text style={s.confirmSub}>You can sign back in anytime.</Text>
                </View>
              </View>
              {signOutError ? (
                <Text style={s.confirmError}>{signOutError}</Text>
              ) : null}
              <View style={s.confirmBtns}>
                <TouchableOpacity
                  style={s.cancelBtn}
                  onPress={() => { setConfirmSignOut(false); setSignOutError(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.logOutBtn, loading && { opacity: 0.6 }]}
                  onPress={handleSignOut}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-out-outline" size={14} color="#fff" />
                  <Text style={s.logOutBtnText}>
                    {loading ? 'Signing out…' : 'Sign Out'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerDotRow}>
            <View style={s.footerDot} />
          </View>
          <Text style={s.footerText}>Fluxua · Track every commitment</Text>
          <Text style={s.footerSub}>Made with calm intelligence.</Text>
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

  // ── Header ──
  header: { paddingTop: spacing.md },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // ── Profile card (dark navy) ──
  profileCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    ...shadows.hero,
  },
  profileGlowA: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.teal,
    opacity: 0.14,
  },
  profileGlowB: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary,
    opacity: 0.11,
  },
  profileRing: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  profileText: { flex: 1, gap: 4 },
  profileName: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: '#FFFFFF',
    textTransform: 'capitalize',
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.55)',
  },
  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  profileBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.teal,
  },
  profileBadgeLabel: {
    fontSize: typography.xs,
    color: colors.teal,
    fontWeight: typography.semibold,
    letterSpacing: 0.2,
  },

  // ── Sign out section ──
  signOutSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    gap: spacing.md,
    backgroundColor: colors.dangerLight,
  },
  signOutIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  signOutLabel: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.danger,
  },

  // ── Confirm sign-out ──
  confirmBox: {
    padding: spacing.base,
    gap: spacing.md,
    backgroundColor: colors.dangerLight,
  },
  confirmTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  confirmTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  confirmSub: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  confirmError: {
    fontSize: typography.sm,
    color: colors.danger,
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  logOutBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  logOutBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: '#fff',
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    gap: 4,
    paddingTop: spacing.xs,
  },
  footerDotRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
    opacity: 0.55,
  },
  footerText: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    fontWeight: typography.medium,
  },
  footerSub: {
    fontSize: 10,
    color: colors.textDisabled,
    opacity: 0.7,
  },
});
