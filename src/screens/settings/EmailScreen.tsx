import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Email'>;

type Step = 'overview' | 'change' | 'success';

export default function EmailScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const currentEmail = user?.email ?? '';
  const isVerified = user?.email_confirmed_at != null;

  const [step, setStep] = useState<Step>('overview');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const [newFocused, setNewFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await supabase.auth.resend({ type: 'signup', email: currentEmail });
      setResendDone(true);
    } catch {
      // silently fail — don't expose email enumeration
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    setError('');
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      setError('Enter a valid email address.'); return;
    }
    if (!password.trim()) {
      setError('Password is required to change your email.'); return;
    }
    setLoading(true);
    try {
      // Re-auth first
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password,
      });
      if (signInErr) { setError('Incorrect password. Please try again.'); setLoading(false); return; }

      const { error: updateErr } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (updateErr) throw updateErr;
      setStep('success');
    } catch (e: any) {
      setError(e.message ?? 'Failed to update email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <SubScreenHeader title="Email Address" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'success' ? (
            /* ── Success state ── */
            <View style={s.successCard}>
              <View style={s.successIconWrap}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              </View>
              <Text style={s.successTitle}>Verification Sent</Text>
              <Text style={s.successBody}>
                We've sent a verification link to{'\n'}
                <Text style={s.successEmail}>{newEmail}</Text>.{'\n\n'}
                Open the email and click the link to confirm your new address.
              </Text>
              <TouchableOpacity
                style={s.doneBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={s.doneBtnText}>Back to Settings</Text>
              </TouchableOpacity>
            </View>
          ) : step === 'overview' ? (
            <>
              {/* ── Current email card ── */}
              <View style={s.card}>
                <Text style={s.sectionLabel}>Current Email</Text>
                <View style={s.currentEmailRow}>
                  <View style={[s.emailIconWrap, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="mail" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.emailAddr} numberOfLines={1}>{currentEmail}</Text>
                    <View style={s.verifyRow}>
                      <Ionicons
                        name={isVerified ? 'checkmark-circle' : 'alert-circle-outline'}
                        size={13}
                        color={isVerified ? colors.success : colors.warning}
                      />
                      <Text style={[s.verifyLabel, { color: isVerified ? colors.success : colors.warning }]}>
                        {isVerified ? 'Verified' : 'Not verified'}
                      </Text>
                    </View>
                  </View>
                </View>

                {!isVerified && (
                  <TouchableOpacity
                    style={s.resendBtn}
                    onPress={handleResendVerification}
                    disabled={resendLoading || resendDone}
                    activeOpacity={0.75}
                  >
                    {resendLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons
                          name={resendDone ? 'checkmark-circle-outline' : 'send-outline'}
                          size={14}
                          color={resendDone ? colors.success : colors.primary}
                        />
                        <Text style={[s.resendLabel, resendDone && { color: colors.success }]}>
                          {resendDone ? 'Verification email sent' : 'Resend verification email'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* ── Change email CTA ── */}
              <TouchableOpacity
                style={s.changeBtn}
                onPress={() => setStep('change')}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil-outline" size={18} color="#fff" />
                <Text style={s.changeBtnText}>Change Email Address</Text>
              </TouchableOpacity>

              <Text style={s.footNote}>
                Changing your email requires password confirmation and will send a verification link to your new address.
              </Text>
            </>
          ) : (
            /* ── Change form ── */
            <>
              <View style={s.card}>
                <Text style={s.sectionLabel}>New Email Address</Text>
                <TextInput
                  style={[s.input, newFocused && s.inputFocused]}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Enter new email"
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setNewFocused(true)}
                  onBlur={() => setNewFocused(false)}
                />
              </View>

              <View style={s.card}>
                <Text style={s.sectionLabel}>Confirm with Password</Text>
                <View style={s.passRow}>
                  <TextInput
                    style={[s.input, passFocused && s.inputFocused, { flex: 1 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Current password"
                    placeholderTextColor={colors.textDisabled}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                  />
                  <TouchableOpacity
                    style={s.eyeBtn}
                    onPress={() => setShowPassword(v => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={s.passNote}>
                  Required to confirm your identity before changing the email.
                </Text>
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.changeBtn, loading && { opacity: 0.65 }]}
                onPress={handleChangeEmail}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={s.changeBtnText}>Update Email</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={s.cancelLink}
                onPress={() => { setStep('overview'); setError(''); setPassword(''); setNewEmail(''); }}
                activeOpacity={0.7}
              >
                <Text style={s.cancelLinkText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    ...shadows.card,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Current email ──
  currentEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emailIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  emailAddr: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  verifyLabel: { fontSize: typography.xs, fontWeight: typography.semibold },

  // ── Resend ──
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  resendLabel: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.primary },

  // ── Inputs ──
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: 13,
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  passNote: { fontSize: typography.xs, color: colors.textTertiary, lineHeight: 18 },

  // ── Error ──
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: typography.sm, color: colors.danger },

  // ── Buttons ──
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  changeBtnText: { fontSize: typography.base, fontWeight: typography.bold, color: '#fff' },
  cancelLink: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelLinkText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.medium },
  footNote: {
    fontSize: typography.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },

  // ── Success ──
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
    marginTop: spacing.xxl,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  successBody: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: { fontWeight: typography.bold, color: colors.textPrimary },
  doneBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: 13,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
  },
  doneBtnText: { fontSize: typography.base, fontWeight: typography.bold, color: '#fff' },
});
