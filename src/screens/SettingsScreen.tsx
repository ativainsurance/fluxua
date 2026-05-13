import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing, radius, shadows } from '../theme';

// ─────────────────────────────────────────────
// Settings row component
// ─────────────────────────────────────────────

const SettingsRow = ({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  chevron = false,
  onPress,
  danger = false,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  chevron?: boolean;
  onPress?: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    style={rowStyles.row}
    onPress={onPress}
    activeOpacity={onPress ? 0.65 : 1}
    disabled={!onPress}
  >
    <View style={[rowStyles.iconWrap, { backgroundColor: iconBg }]}>
      <Ionicons name={icon as any} size={18} color={iconColor} />
    </View>
    <Text style={[rowStyles.label, danger && { color: colors.danger }]}>{label}</Text>
    {value ? <Text style={rowStyles.value} numberOfLines={1}>{value}</Text> : null}
    {chevron && (
      <Ionicons
        name="chevron-forward"
        size={16}
        color={danger ? colors.danger : colors.textDisabled}
      />
    )}
  </TouchableOpacity>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
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
  value: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    maxWidth: 160,
  },
});

// ─────────────────────────────────────────────
// Section group — label + card wrapper
// ─────────────────────────────────────────────

const SectionCard = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View style={sectionStyles.group}>
    <Text style={sectionStyles.label}>{label}</Text>
    <View style={sectionStyles.card}>
      {children}
    </View>
  </View>
);

const sectionStyles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
});

const Divider = () => <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 66 }} />;

// ─────────────────────────────────────────────
// SettingsScreen
// ─────────────────────────────────────────────

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

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
  const displayName = emailDisplay.split('@')[0] ?? 'User';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* ── Premium Profile Card — dark navy ── */}
        <View style={styles.profileCard}>
          {/* Ambient glow */}
          <View style={styles.profileGlowA} />
          <View style={styles.profileGlowB} />
          {/* Decorative ring */}
          <View style={styles.profileRing} />

          <View style={styles.profileContent}>
            {/* Avatar */}
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitial}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{emailDisplay}</Text>
              <View style={styles.profileBadge}>
                <View style={styles.profileBadgeDot} />
                <Text style={styles.profileBadgeText}>Personal & Business</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Account section ── */}
        <SectionCard label="Account">
          <SettingsRow
            icon="person-circle-outline"
            iconColor={colors.primary}
            iconBg={colors.primaryLight}
            label="Email"
            value={emailDisplay}
          />
        </SectionCard>

        {/* ── App section ── */}
        <SectionCard label="App">
          <SettingsRow
            icon="shield-checkmark-outline"
            iconColor={colors.teal}
            iconBg={colors.tealLight}
            label="Privacy"
            value="Your data stays private"
          />
          <Divider />
          <SettingsRow
            icon="information-circle-outline"
            iconColor={colors.textSecondary}
            iconBg={colors.surfaceAlt}
            label="App Version"
            value="1.0.0"
          />
        </SectionCard>

        {/* ── Account actions ── */}
        <SectionCard label="Actions">
          {!confirmSignOut ? (
            <SettingsRow
              icon="log-out-outline"
              iconColor={colors.danger}
              iconBg={colors.dangerLight}
              label="Sign Out"
              danger
              chevron
              onPress={() => setConfirmSignOut(true)}
            />
          ) : (
            <View style={styles.confirmBox}>
              <View style={styles.confirmHeader}>
                <View style={[styles.confirmIconWrap, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                </View>
                <View>
                  <Text style={styles.confirmTitle}>Sign out of Fluxua?</Text>
                  <Text style={styles.confirmSub}>You can sign back in anytime.</Text>
                </View>
              </View>
              {signOutError ? (
                <Text style={styles.confirmError}>{signOutError}</Text>
              ) : null}
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setConfirmSignOut(false); setSignOutError(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signOutBtn, loading && { opacity: 0.6 }]}
                  onPress={handleSignOut}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-out-outline" size={14} color="#fff" />
                  <Text style={styles.signOutBtnText}>{loading ? 'Signing out…' : 'Sign Out'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SectionCard>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <View style={styles.footerDot} />
          </View>
          <Text style={styles.footerText}>Fluxua · Track every commitment</Text>
          <Text style={styles.footerSub}>Made with calm intelligence.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

  // ── Premium profile card ──
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
  profileInfo: {
    flex: 1,
    gap: 4,
  },
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
    fontWeight: typography.regular,
  },
  profileBadge: {
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
  profileBadgeText: {
    fontSize: typography.xs,
    color: colors.teal,
    fontWeight: typography.semibold,
    letterSpacing: 0.2,
  },

  // ── Sign-out confirm ──
  confirmBox: {
    padding: spacing.base,
    gap: spacing.md,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  confirmIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
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
    paddingHorizontal: spacing.xs,
  },
  confirmActions: {
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
  signOutBtn: {
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
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 3,
  },
  signOutBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: '#fff',
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    gap: 4,
    paddingTop: spacing.sm,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
    opacity: 0.6,
  },
  footerText: {
    textAlign: 'center',
    fontSize: typography.xs,
    color: colors.textDisabled,
    fontWeight: '500',
  },
  footerSub: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.textDisabled,
    opacity: 0.7,
  },
});
