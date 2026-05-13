import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import { typography, spacing, radius, shadows } from '../../theme';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Email'>;

type Step = 'overview' | 'change' | 'success';

export default function EmailScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { colors } = useTheme();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SubScreenHeader title="Email Address" onBack={() => navigation.goBack()} />
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
          {step === 'success' ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.xxl, padding: spacing.xl, alignItems: 'center', gap: spacing.md, ...shadows.card, marginTop: spacing.xxl }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successLight, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm }}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              </View>
              <Text style={{ fontSize: typography.xl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: -0.4 }}>Verification Sent</Text>
              <Text style={{ fontSize: typography.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                We've sent a verification link to{'\n'}
                <Text style={{ fontWeight: typography.bold, color: colors.textPrimary }}>{newEmail}</Text>.{'\n\n'}
                Open the email and click the link to confirm your new address.
              </Text>
              <TouchableOpacity
                style={{ marginTop: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: 13, backgroundColor: colors.primary, borderRadius: radius.lg }}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: '#fff' }}>Back to Settings</Text>
              </TouchableOpacity>
            </View>
          ) : step === 'overview' ? (
            <>
              <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, ...shadows.card }}>
                <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' }}>Current Email</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <Ionicons name="mail" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary }} numberOfLines={1}>{currentEmail}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons
                        name={isVerified ? 'checkmark-circle' : 'alert-circle-outline'}
                        size={13}
                        color={isVerified ? colors.success : colors.warning}
                      />
                      <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: isVerified ? colors.success : colors.warning }}>
                        {isVerified ? 'Verified' : 'Not verified'}
                      </Text>
                    </View>
                  </View>
                </View>

                {!isVerified && (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10, paddingHorizontal: spacing.md, backgroundColor: colors.primaryLight, borderRadius: radius.md, alignSelf: 'flex-start' }}
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
                        <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: resendDone ? colors.success : colors.primary }}>
                          {resendDone ? 'Verification email sent' : 'Resend verification email'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 15, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 4 }}
                onPress={() => setStep('change')}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil-outline" size={18} color="#fff" />
                <Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: '#fff' }}>Change Email Address</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: typography.xs, color: colors.textTertiary, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.sm }}>
                Changing your email requires password confirmation and will send a verification link to your new address.
              </Text>
            </>
          ) : (
            <>
              <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, ...shadows.card }}>
                <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' }}>New Email Address</Text>
                <TextInput
                  style={{ backgroundColor: newFocused ? colors.surface : colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1.5, borderColor: newFocused ? colors.primary : colors.border, paddingHorizontal: spacing.base, paddingVertical: 13, fontSize: typography.base, color: colors.textPrimary }}
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

              <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, ...shadows.card }}>
                <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' }}>Confirm with Password</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: passFocused ? colors.surface : colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1.5, borderColor: passFocused ? colors.primary : colors.border, paddingHorizontal: spacing.base, paddingVertical: 13, fontSize: typography.base, color: colors.textPrimary }}
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
                    style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border }}
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
                <Text style={{ fontSize: typography.xs, color: colors.textTertiary, lineHeight: 18 }}>
                  Required to confirm your identity before changing the email.
                </Text>
              </View>

              {error ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerLight, borderRadius: radius.md, paddingHorizontal: spacing.base, paddingVertical: 10 }}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                  <Text style={{ flex: 1, fontSize: typography.sm, color: colors.danger }}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 15, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 4, opacity: loading ? 0.65 : 1 }}
                onPress={handleChangeEmail}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: '#fff' }}>Update Email</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: 'center', paddingVertical: spacing.sm }}
                onPress={() => { setStep('overview'); setError(''); setPassword(''); setNewEmail(''); }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.medium }}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
