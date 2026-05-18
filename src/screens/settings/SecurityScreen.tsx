import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { typography, spacing, radius, shadows } from '../../theme';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Security'>;

// ── Password strength ──
const calcStrength = (pass: string): { score: number; label: string; colorKey: 'danger' | 'warning' | 'primary' | 'success' | 'border' } => {
  if (pass.length === 0) return { score: 0, label: '', colorKey: 'border' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (score <= 1) return { score: 1, label: 'Weak', colorKey: 'danger' };
  if (score <= 2) return { score: 2, label: 'Fair', colorKey: 'warning' };
  if (score <= 3) return { score: 3, label: 'Good', colorKey: 'primary' };
  return { score: 4, label: 'Strong', colorKey: 'success' };
};

const StrengthBar = ({ password }: { password: string }) => {
  const { colors } = useTheme();
  const { score, label, colorKey } = calcStrength(password);
  const color = colors[colorKey];
  if (!password) return null;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= score ? color : colors.border }}
          />
        ))}
      </View>
      <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, alignSelf: 'flex-end', color }}>{label}</Text>
    </View>
  );
};

const PassInput = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: spacing.xs }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <TextInput
          style={{ flex: 1, backgroundColor: focused ? colors.surface : colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1.5, borderColor: focused ? colors.primary : colors.border, paddingHorizontal: spacing.base, paddingVertical: 13, fontSize: typography.base, color: colors.textPrimary, ...shadows.sm }}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity
          style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border }}
          onPress={() => setShow(v => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function SecurityScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [biometric, setBiometric] = useState(false);

  const strength = calcStrength(next);

  const validate = () => {
    if (!current) return 'Current password is required.';
    if (next.length < 8) return 'New password must be at least 8 characters.';
    if (next !== confirm) return 'Passwords do not match.';
    if (strength.score < 2) return 'Choose a stronger password.';
    return '';
  };

  const handleChange = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: current,
      });
      if (signInErr) { setError('Current password is incorrect.'); setLoading(false); return; }

      const { error: updateErr } = await supabase.auth.updateUser({ password: next });
      if (updateErr) throw updateErr;

      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => setSuccess(false), 3500);
    } catch (e: any) {
      setError(e.message ?? 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SubScreenHeader title="Security" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xxxl, gap: spacing.base }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Change password ── */}
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, ...shadows.card }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.personalLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.personal} />
              </View>
              <View>
                <Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: colors.textPrimary }}>{t('settings.changePassword')}</Text>
                <Text style={{ fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 }}>{t('settings.keepAccountSecure')}</Text>
              </View>
            </View>

            <View style={{ gap: spacing.md }}>
              <PassInput label="Current Password" value={current} onChange={setCurrent} placeholder="Enter current password" />
              <PassInput label="New Password" value={next} onChange={setNext} placeholder="At least 8 characters" />
              <StrengthBar password={next} />
              <PassInput label="Confirm New Password" value={confirm} onChange={setConfirm} placeholder="Re-enter new password" />
            </View>

            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerLight, borderRadius: radius.md, paddingHorizontal: spacing.base, paddingVertical: 10 }}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                <Text style={{ flex: 1, fontSize: typography.sm, color: colors.danger }}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successLight, borderRadius: radius.md, paddingHorizontal: spacing.base, paddingVertical: 10 }}>
                <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                <Text style={{ flex: 1, fontSize: typography.sm, color: colors.success, fontWeight: typography.semibold }}>{t('settings.passwordUpdated')}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.personal, borderRadius: radius.lg, paddingVertical: 15, shadowColor: colors.personal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4, opacity: loading ? 0.65 : 1 }}
              onPress={handleChange}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.textInverse} />
                  <Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: colors.textInverse }}>{t('settings.updatePassword')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Biometrics ── */}
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, ...shadows.card }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.tealLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                  <Ionicons name="finger-print-outline" size={20} color={colors.teal} />
                </View>
                <View>
                  <Text style={{ fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary }}>{t('settings.faceIdBiometrics')}</Text>
                  <Text style={{ fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 }}>{t('settings.unlockWithBiometrics')}</Text>
                </View>
              </View>
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: colors.border, true: colors.teal }}
                thumbColor={colors.textInverse}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>
            <Text style={{ fontSize: typography.xs, color: colors.textTertiary, lineHeight: 18, paddingHorizontal: spacing.xs }}>
              {t('settings.biometricFutureNote')}
            </Text>
          </View>

          {/* ── Active sessions ── */}
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, ...shadows.card }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.businessLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.business} />
              </View>
              <View>
                <Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: colors.textPrimary }}>{t('settings.activeSessions')}</Text>
                <Text style={{ fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 }}>{t('settings.devicesLoggedIn')}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.successLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <Ionicons name="phone-portrait" size={16} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary }}>{t('settings.thisDevice')}</Text>
                <Text style={{ fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 }}>{t('settings.currentSessionActive')}</Text>
              </View>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, flexShrink: 0 }} />
            </View>

            <Text style={{ fontSize: typography.xs, color: colors.textTertiary, lineHeight: 18, paddingHorizontal: spacing.xs }}>
              {t('settings.sessionManagementFuture')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
