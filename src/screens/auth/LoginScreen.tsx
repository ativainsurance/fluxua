import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { gradient, typography, spacing, radius, shadows } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';
import { GradientButton } from '../../components/GradientButton';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError(t('auth.errorEmailPasswordRequired'));
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const lower = msg.toLowerCase();
      setError(
        lower.includes('invalid') || lower.includes('credentials')
          ? t('auth.errorIncorrectCredentials')
          : msg || t('auth.errorLoginFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const bgColors = isDark ? gradient.authBgDark : gradient.authBg;

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={bgColors}
        start={gradient.authBgStart}
        end={gradient.authBgEnd}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Logo / Branding */}
              <View style={styles.brand}>
                <LinearGradient
                  colors={gradient.brand}
                  start={gradient.brandStart}
                  end={gradient.brandEnd}
                  style={styles.logoCircle}
                >
                  <Ionicons name="wallet" size={30} color={colors.textInverse} />
                </LinearGradient>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <Text style={styles.appName}>Fluxua</Text>
                <Text style={styles.tagline}>{t('auth.tagline')}</Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <Text style={styles.formTitle}>{t('auth.welcomeBack')}</Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.field}>
                  <Text style={styles.label}>{t('auth.email')}</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={colors.textDisabled}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('auth.password')}</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('auth.passwordPlaceholder')}
                      placeholderTextColor={colors.textDisabled}
                      secureTextEntry={!showPw}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPw(!showPw)}
                      style={styles.eyeBtn}
                    >
                      <Ionicons
                        name={showPw ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                    style={styles.forgotRow}
                  >
                    <Text style={styles.forgotLink}>{t('auth.forgotPassword')}</Text>
                  </TouchableOpacity>
                </View>

                <GradientButton
                  title={t('auth.signIn')}
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.btn}
                />

                <View style={styles.trustRow}>
                  <Ionicons name="lock-closed" size={12} color={colors.textDisabled} />
                  <Text style={styles.trustText}>{t('auth.privacyMessage')}</Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.footerLink}>{t('auth.createOne')}</Text>
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
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: {
    maxWidth: 480,
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  form: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  formTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: { flex: 1, fontSize: typography.sm, color: colors.danger },
  field: { marginBottom: spacing.base },
  forgotRow: { alignItems: 'flex-end', marginTop: 6 },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  forgotLink: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.medium,
  },
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
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  btn: { marginTop: spacing.sm },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: spacing.md,
  },
  trustText: { fontSize: typography.xs, color: colors.textDisabled },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: colors.textSecondary, fontSize: typography.sm },
  footerLink: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});
