import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth, SignupMeta } from '../../contexts/AuthContext';
import { colors, typography, spacing, radius } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
};

// ─────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────

type AccountType = 'personal' | 'business' | 'both';

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'personal', label: 'Personal', icon: 'person-outline' },
  { value: 'business', label: 'Business', icon: 'briefcase-outline' },
  { value: 'both', label: 'Both', icon: 'git-merge-outline' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'MXN', 'AUD'];
const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
];

// ─────────────────────────────────────────────
// Password strength
// ─────────────────────────────────────────────

type StrengthLevel = 'weak' | 'medium' | 'strong';

const getPasswordStrength = (pw: string): { level: StrengthLevel; score: number } => {
  if (pw.length === 0) return { level: 'weak', score: 0 };
  const hasLength = pw.length >= 8;
  const hasNumber = /\d/.test(pw);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw);
  const score = (hasLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0);
  const level: StrengthLevel = score === 3 ? 'strong' : score === 2 ? 'medium' : 'weak';
  return { level, score };
};

const STRENGTH_COLOR = {
  weak: colors.danger,
  medium: colors.warning,
  strong: colors.success,
} as const;

const STRENGTH_HINT = {
  weak: '8+ characters required',
  medium: 'Add a symbol (!, @, #…) for a stronger password',
  strong: 'Great password!',
} as const;

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const StrengthBar = ({ score, level }: { score: number; level: StrengthLevel }) => {
  if (score === 0) return null;
  const color = STRENGTH_COLOR[level];
  return (
    <View style={sbStyles.wrap}>
      <View style={sbStyles.bar}>
        <View style={[sbStyles.seg, { backgroundColor: score >= 1 ? color : colors.border }]} />
        <View style={[sbStyles.seg, { backgroundColor: score >= 2 ? color : colors.border }]} />
        <View style={[sbStyles.seg, { backgroundColor: score >= 3 ? color : colors.border }]} />
      </View>
      <View style={sbStyles.row}>
        <Text style={[sbStyles.label, { color }]}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </Text>
        <Text style={sbStyles.hint}>{STRENGTH_HINT[level]}</Text>
      </View>
    </View>
  );
};

const sbStyles = StyleSheet.create({
  wrap: { marginTop: 6 },
  bar: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: typography.xs, fontWeight: typography.semibold },
  hint: { fontSize: typography.xs, color: colors.textDisabled, flex: 1 },
});

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Derived validation
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const { level: pwLevel, score: pwScore } = getPasswordStrength(password);
  const passwordValid = pwScore >= 2; // Medium or Strong: 8+ chars + number
  const confirmVisible = passwordValid;
  const confirmMatch = confirm.length > 0 && confirm === password;
  const confirmMismatch = confirm.length > 0 && confirm !== password;

  const validate = (): string | null => {
    if (!firstName.trim()) return 'Please enter your first name.';
    if (!emailValid) return 'Please enter a valid email address.';
    if (pwScore < 1) return 'Password must be at least 8 characters.';
    if (pwScore < 2) return 'Password must contain at least one number.';
    if (!confirmVisible || !confirmMatch) return 'Passwords do not match.';
    if ((accountType === 'business' || accountType === 'both') && !businessName.trim()) {
      return 'Please enter your business name.';
    }
    return null;
  };

  const handleSignup = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const meta: SignupMeta = {
        firstName: firstName.trim(),
        businessName: businessName.trim() || undefined,
        accountType,
        currency,
        language,
      };
      await signUp(email.trim().toLowerCase(), password, meta);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>You're in!</Text>
          <Text style={styles.successText}>
            We sent a confirmation link to{'\n'}
            <Text style={styles.successEmail}>{email}</Text>
          </Text>
          <Text style={styles.successSub}>
            Click the link in your email to activate your account, then come back and sign in.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Start controlling your money flow</Text>
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── PERSONAL INFO ────────────────────────── */}
          <Text style={styles.sectionLabel}>PERSONAL INFO</Text>

          {/* First Name */}
          <View style={styles.field}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, firstName.trim().length > 0 && styles.inputWithCheck]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ana"
                placeholderTextColor={colors.textDisabled}
                autoCapitalize="words"
              />
              {firstName.trim().length > 0 && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                </View>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, emailValid && styles.inputWithCheck]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailValid && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                </View>
              )}
            </View>
          </View>

          {/* ── ACCOUNT TYPE ─────────────────────────── */}
          <Text style={styles.sectionLabel}>WHAT WILL YOU USE FLUXUA FOR?</Text>
          <View style={styles.pillRow}>
            {ACCOUNT_TYPES.map(({ value, label, icon }) => {
              const active = accountType === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setAccountType(value)}
                >
                  <Ionicons
                    name={icon as any}
                    size={14}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Business Name (conditional) */}
          {(accountType === 'business' || accountType === 'both') && (
            <View style={styles.field}>
              <Text style={styles.label}>Business Name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, businessName.trim().length > 0 && styles.inputWithCheck]}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Acme Corp"
                  placeholderTextColor={colors.textDisabled}
                  autoCapitalize="words"
                />
                {businessName.trim().length > 0 && (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── PREFERENCES ──────────────────────────── */}
          <Text style={styles.sectionLabel}>PREFERENCES</Text>

          {/* Currency */}
          <View style={styles.field}>
            <Text style={styles.label}>Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              <View style={styles.pillRowInner}>
                {CURRENCIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.pill, styles.pillSm, currency === c && styles.pillActive]}
                    onPress={() => setCurrency(c)}
                  >
                    <Text style={[styles.pillText, currency === c && styles.pillTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Language */}
          <View style={styles.field}>
            <Text style={styles.label}>Language</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              <View style={styles.pillRowInner}>
                {LANGUAGES.map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.pill, styles.pillSm, language === value && styles.pillActive]}
                    onPress={() => setLanguage(value)}
                  >
                    <Text style={[styles.pillText, language === value && styles.pillTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.fieldHint}>Full translation requires app language settings</Text>
          </View>

          {/* ── SECURITY ─────────────────────────────── */}
          <Text style={styles.sectionLabel}>SECURITY</Text>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, passwordValid && styles.inputWithCheck]}
                value={password}
                onChangeText={setPassword}
                placeholder="8+ characters, at least one number"
                placeholderTextColor={colors.textDisabled}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPw(!showPw)}
                style={[styles.checkIcon, styles.eyeBtn]}
              >
                <Ionicons
                  name={showPw ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <StrengthBar score={pwScore} level={pwLevel} />
          </View>

          {/* Confirm Password — only shown when password is valid */}
          {confirmVisible && (
            <View style={styles.field}>
              <Text style={styles.label}>
                Confirm Password{' '}
                <Text style={styles.labelHint}>· Must match your password</Text>
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    confirmMatch && styles.inputWithCheck,
                    confirmMismatch && styles.inputError,
                  ]}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repeat your password"
                  placeholderTextColor={colors.textDisabled}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={[styles.checkIcon, styles.eyeBtn]}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off' : 'eye'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmMatch && (
                <View style={styles.matchRow}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={[styles.matchText, { color: colors.success }]}>Passwords match</Text>
                </View>
              )}
              {confirmMismatch && (
                <View style={styles.matchRow}>
                  <Ionicons name="close-circle" size={13} color={colors.danger} />
                  <Text style={[styles.matchText, { color: colors.danger }]}>Passwords don't match</Text>
                </View>
              )}
            </View>
          )}

          {/* ── CTA ──────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Start tracking my flow</Text>
            )}
          </TouchableOpacity>

          {/* Trust signal */}
          <View style={styles.trustRow}>
            <Ionicons name="lock-closed" size={12} color={colors.textDisabled} />
            <Text style={styles.trustText}>Your financial data stays private and protected</Text>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By creating an account, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Sign in link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  back: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    marginLeft: -spacing.xs,
  },
  header: { marginBottom: spacing.xl },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.base,
  },
  errorText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.danger,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textDisabled,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  field: { marginBottom: spacing.base },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  labelHint: {
    fontWeight: typography.regular,
    color: colors.textDisabled,
  },
  inputRow: { position: 'relative' },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.base,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputWithCheck: { paddingRight: 44 },
  inputError: { borderColor: colors.danger },
  passwordInput: { paddingRight: 44 },
  checkIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeBtn: {},
  fieldHint: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    marginTop: 4,
  },

  // Pill selectors
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  pillRowInner: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hScroll: { marginBottom: spacing.xs },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pillSm: {
    flex: 0,
    paddingHorizontal: spacing.base,
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  pillText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },

  // Match indicator
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  matchText: { fontSize: typography.xs, fontWeight: typography.medium },

  // CTA area
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: '#fff',
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: spacing.md,
  },
  trustText: {
    fontSize: typography.xs,
    color: colors.textDisabled,
  },
  terms: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.md,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: typography.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: { color: colors.textSecondary, fontSize: typography.sm },
  footerLink: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },

  // Success state
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  successText: {
    fontSize: typography.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  successEmail: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  successSub: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
