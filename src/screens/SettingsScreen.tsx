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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
            <Text style={styles.userSub}>Personal & Business Commitments</Text>
          </View>
        </View>

        {/* Settings rows */}
        <View style={styles.card}>
          {/* Account */}
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.rowLabel}>Account</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{user?.email ?? ''}</Text>
          </View>

          <View style={styles.divider} />

          {/* Version */}
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.rowLabel}>App Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>

          <View style={styles.divider} />

          {/* Sign Out */}
          {!confirmSignOut ? (
            <TouchableOpacity
              style={styles.row}
              onPress={() => setConfirmSignOut(true)}
              activeOpacity={0.6}
            >
              <View style={[styles.rowIcon, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.danger }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.danger} />
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>Sign out of Fluxua?</Text>
              {signOutError ? (
                <Text style={styles.confirmError}>{signOutError}</Text>
              ) : null}
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setConfirmSignOut(false); setSignOutError(''); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signOutBtn, loading && { opacity: 0.6 }]}
                  onPress={handleSignOut}
                  disabled={loading}
                >
                  <Text style={styles.signOutBtnText}>{loading ? 'Signing out…' : 'Sign Out'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* App info */}
        <Text style={styles.footer}>
          Fluxua · Track every commitment
        </Text>
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
  header: {
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  userSub: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.base,
    color: colors.textPrimary,
    fontWeight: typography.medium,
  },
  rowValue: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    maxWidth: 160,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider ?? colors.border,
    marginLeft: spacing.base + 36 + spacing.md,
  },
  confirmBox: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  confirmText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  confirmError: {
    fontSize: typography.sm,
    color: colors.danger,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
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
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  signOutBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: '#fff',
  },
  footer: {
    textAlign: 'center',
    fontSize: typography.xs,
    color: colors.textDisabled,
    paddingTop: spacing.sm,
  },
});
