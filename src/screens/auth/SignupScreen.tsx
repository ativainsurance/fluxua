import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTranslation } from 'react-i18next';
import { useAuth, SignupMeta } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { gradient, typography, spacing, radius, shadows } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';
import { GradientButton } from '../../components/GradientButton';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
};

type AccountType = 'personal' | 'business' | 'both';

const ACCOUNT_TYPES: { value: AccountType; icon: string }[] = [
  { value: 'personal', icon: 'person-outline' },
  { value: 'business', icon: 'briefcase-outline' },
  { value: 'both', icon: 'git-merge-outline' },
];

// ── Password strength ──────────────────────────────────────────────────────

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

const StrengthBar = ({ score, level, colors }: { score: number; level: StrengthLevel; colors: any }) => {
  const { t } = useTranslation();
  if (score === 0) return null;
  const color =
    level === 'strong' ? colors.success :
    level === 'medium' ? colors.warning :
    colors.danger;
  const cap = level.charAt(0).toUpperCase() + level.slice(1);
  return (
    <View style={sbStyles.wrap}>
      <View style={sbStyles.bar}>
        <View style={[sbStyles.seg, { backgroundColor: score >= 1 ? color : colors.border }]} />
        <View style={[sbStyles.seg, { backgroundColor: score >= 2 ? color : colors.border }]} />
        <View style={[sbStyles.seg, { backgroundColor: score >= 3 ? color : colors.border }]} />
      </View>
      <View style={sbStyles.row}>
        <Text style={[sbStyles.label, { color }]}>
          {t(`auth.passwordStrength${cap}`)}
        </Text>
        <Text style={[sbStyles.hint, { color: colors.textDisabled }]}>{t(`auth.passwordHint${cap}`)}</Text>
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
  hint: { fontSize: typography.xs, flex: 1 },
});

// ── FadeInSection ──────────────────────────────────────────────────────────

const FadeInSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }).start();
  }, []);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
};

// ── Main component ─────────────────────────────────────────────────────────

export default function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [firstName, setFirstName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const { level: pwLevel, score: pwScore } = getPasswordStrength(password);
  const passwordValid = pwScore >= 2;
  const confirmVisible = passwordValid;
  const confirmMatch = confirm.length > 0 && confirm === password;
  const confirmMismatch = confirm.length > 0 && confirm !== password;

  const section1Complete = firstName.trim().length > 0 && emailValid;
  const section2Complete = accountType === 'personal' || businessName.trim().length > 0;

  const validate = (): string | null => {
    if (!firstName.trim()) return t('auth.errorFirstNameRequired');
    if (!emailValid) return t('auth.errorEmailInvalid');
    if ((accountType === 'business' || accountType === 'both') && !businessName.trim())
      return t('auth.errorBusinessNameRequired');
    if (pwScore < 1) return t('auth.errorPasswordTooShort');
    if (pwScore < 2) return t('auth.errorPasswordNoNumber');
    if (!confirmVisible || !confirmMatch) return t('auth.errorPasswordsMismatch');
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
        currency: 'USD',
        language: 'en',
      };
      await signUp(email.trim().toLowerCase(), password, meta);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errorSignupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const bgColors = isDark ? gradient.authBgDark : gradient.authBg;

  // ── Success ────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <View style={styles.outer}>
        <LinearGradient colors={bgColors} start={gradient.authBgStart} end={gradient.authBgEnd} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>{t('auth.signupSuccessTitle')}</Text>
            <Text style={styles.successText}>
              {t('auth.signupSuccessMessage')}{'\n'}
              <Text style={styles.successEmail}>{email}</Text>
            </Text>
            <Text style={styles.successSub}>{t('auth.signupSuccessInstructions')}</Text>
            <GradientButton title={t('auth.goToSignIn')} onPress={() => navigation.navigate('Login')} style={styles.btn} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.outer}>
      <LinearGradient colors={bgColors} start={gradient.authBgStart} end={gradient.authBgEnd} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollOuter}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>

              <View style={styles.header}>
                <Text style={styles.title}>{t('auth.createAccountTitle')}</Text>
                <Text style={styles.subtitle}>{t('auth.createAccountSubtitle')}</Text>
              </View>

              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* ── Block 1: Basic Info ───────────────────── */}
              <Text style={[styles.sectionLabel, { marginTop: 0 }]}>{t('auth.sectionBasicInfo')}</Text>

              <View style={styles.field}>
                <Text style={styles.label}>{t('auth.firstNameLabel')}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, firstName.trim().length > 0 && styles.inputWithCheck]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder={t('auth.firstNamePlaceholder')}
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

              <View style={styles.field}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, emailValid && styles.inputWithCheck]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('auth.emailPlaceholder')}
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

              {/* ── Block 2: Setup ────────────────────────── */}
              {section1Complete && (
                <FadeInSection>
                  <Text style={styles.sectionLabel}>{t('auth.sectionSetup')}</Text>
                  <View style={styles.pillRow}>
                    {ACCOUNT_TYPES.map(({ value, icon }) => {
                      const active = accountType === value;
                      const cap = value.charAt(0).toUpperCase() + value.slice(1);
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
                            {t(`auth.accountType${cap}`)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {(accountType === 'business' || accountType === 'both') && (
                    <View style={styles.field}>
                      <Text style={styles.label}>{t('auth.businessNameLabel')}</Text>
                      <View style={styles.inputRow}>
                        <TextInput
                          style={[styles.input, businessName.trim().length > 0 && styles.inputWithCheck]}
                          value={businessName}
                          onChangeText={setBusinessName}
                          placeholder={t('auth.businessNamePlaceholder')}
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
                </FadeInSection>
              )}

              {/* ── Block 3: Security ─────────────────────── */}
              {section1Complete && section2Complete && (
                <FadeInSection delay={150}>
                  <Text style={styles.sectionLabel}>{t('auth.sectionSecurity')}</Text>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('auth.password')}</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.input, styles.passwordInput, passwordValid && styles.inputWithCheck]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder={t('auth.passwordInputPlaceholder')}
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
                    <StrengthBar score={pwScore} level={pwLevel} colors={colors} />
                  </View>

                  {confirmVisible && (
                    <View style={styles.field}>
                      <Text style={styles.label}>
                        {t('auth.confirmPasswordLabel')}{' '}
                        <Text style={styles.labelHint}>{t('auth.confirmPasswordHint')}</Text>
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
                          placeholder={t('auth.confirmPasswordPlaceholder')}
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
                          <Text style={[styles.matchText, { color: colors.success }]}>{t('auth.passwordsMatch')}</Text>
                        </View>
                      )}
                      {confirmMismatch && (
                        <View style={styles.matchRow}>
                          <Ionicons name="close-circle" size={13} color={colors.danger} />
                          <Text style={[styles.matchText, { color: colors.danger }]}>{t('auth.passwordsMismatch')}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </FadeInSection>
              )}

              {/* ── CTA ──────────────────────────────────── */}
              <GradientButton
                title={t('auth.startTracking')}
                onPress={handleSignup}
                loading={loading}
                style={styles.btn}
              />

              <View style={styles.trustRow}>
                <Ionicons name="lock-closed" size={12} color={colors.textDisabled} />
                <Text style={styles.trustText}>{t('auth.securityMessage')}</Text>
              </View>

              <Text style={styles.terms}>
                {t('auth.termsAgreement')}{' '}
                <Text style={styles.termsLink}>{t('auth.termsOfService')}</Text>
                {' '}{t('auth.termsAnd')}{' '}
                <Text style={styles.termsLink}>{t('auth.privacyPolicyLink')}</Text>
              </Text>

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t('auth.hasAccount')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>{t('auth.signIn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  outer: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  scrollOuter: { alignItems: 'center' },
  content: {
    maxWidth: 480,
    width: '100%',
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
  subtitle: { fontSize: typography.base, color: colors.textSecondary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.base,
  },
  errorText: { flex: 1, fontSize: typography.sm, color: colors.danger },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textDisabled,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xxl,
  },
  field: { marginBottom: spacing.base },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  labelHint: { fontWeight: typography.regular, color: colors.textDisabled },
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
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
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
  pillActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pillText: { fontSize: typography.sm, fontWeight: typography.medium, color: colors.textSecondary },
  pillTextActive: { color: colors.primary, fontWeight: typography.semibold },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  matchText: { fontSize: typography.xs, fontWeight: typography.medium },
  btn: { marginTop: spacing.xl },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: spacing.md,
  },
  trustText: { fontSize: typography.xs, color: colors.textDisabled },
  terms: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.md,
  },
  termsLink: { color: colors.primary, fontWeight: typography.medium },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { color: colors.textSecondary, fontSize: typography.sm },
  footerLink: { color: colors.primary, fontSize: typography.sm, fontWeight: typography.semibold },
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
  successText: { fontSize: typography.base, color: colors.textSecondary, lineHeight: 24 },
  successEmail: { color: colors.primary, fontWeight: typography.semibold },
  successSub: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: 20 },
});
