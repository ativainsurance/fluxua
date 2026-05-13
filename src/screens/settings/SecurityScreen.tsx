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
  Switch,
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

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Security'>;

// ── Password strength ──
const calcStrength = (pass: string): { score: number; label: string; color: string } => {
  if (pass.length === 0) return { score: 0, label: '', color: colors.border };
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (score <= 1) return { score: 1, label: 'Weak', color: colors.danger };
  if (score <= 2) return { score: 2, label: 'Fair', color: colors.warning };
  if (score <= 3) return { score: 3, label: 'Good', color: colors.primary };
  return { score: 4, label: 'Strong', color: colors.success };
};

const StrengthBar = ({ password }: { password: string }) => {
  const { score, label, color } = calcStrength(password);
  if (!password) return null;
  return (
    <View style={str.wrapper}>
      <View style={str.barRow}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[str.segment, { backgroundColor: i <= score ? color : colors.border }]}
          />
        ))}
      </View>
      <Text style={[str.label, { color }]}>{label}</Text>
    </View>
  );
};
const str = StyleSheet.create({
  wrapper: { gap: 6 },
  barRow: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: typography.xs, fontWeight: typography.semibold, alignSelf: 'flex-end' },
});

// ── Password input ──
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
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={pi.wrapper}>
      <Text style={pi.label}>{label}</Text>
      <View style={pi.row}>
        <TextInput
          style={[pi.input, focused && pi.inputFocused]}
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
          style={pi.eyeBtn}
          onPress={() => setShow(v => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
const pi = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: 13,
    fontSize: typography.base,
    color: colors.textPrimary,
    ...shadows.sm,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
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
});

export default function SecurityScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

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
      // Re-authenticate
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
    <SafeAreaView style={s.safe}>
      <SubScreenHeader title="Security" onBack={() => navigation.goBack()} />
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
          {/* ── Change password ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.cardIcon, { backgroundColor: colors.personalLight }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.personal} />
              </View>
              <View>
                <Text style={s.cardTitle}>Change Password</Text>
                <Text style={s.cardSub}>Keep your account secure</Text>
              </View>
            </View>

            <View style={s.fieldGroup}>
              <PassInput
                label="Current Password"
                value={current}
                onChange={setCurrent}
                placeholder="Enter current password"
              />
              <PassInput
                label="New Password"
                value={next}
                onChange={setNext}
                placeholder="At least 8 characters"
              />
              <StrengthBar password={next} />
              <PassInput
                label="Confirm New Password"
                value={confirm}
                onChange={setConfirm}
                placeholder="Re-enter new password"
              />
            </View>

            {error ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={s.successBox}>
                <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                <Text style={s.successText}>Password updated successfully</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[s.saveBtn, loading && s.saveBtnDim]}
              onPress={handleChange}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                  <Text style={s.saveBtnText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Biometrics ── */}
          <View style={s.card}>
            <View style={s.rowBetween}>
              <View style={s.rowLeft}>
                <View style={[s.cardIcon, { backgroundColor: colors.tealLight }]}>
                  <Ionicons name="finger-print-outline" size={20} color={colors.teal} />
                </View>
                <View>
                  <Text style={s.rowTitle}>Face ID / Biometrics</Text>
                  <Text style={s.rowSub}>Unlock app with biometrics</Text>
                </View>
              </View>
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: colors.border, true: colors.teal }}
                thumbColor="#fff"
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>
            <Text style={s.noteText}>
              Biometric authentication will be available in a future update.
            </Text>
          </View>

          {/* ── Active sessions ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.cardIcon, { backgroundColor: colors.businessLight }]}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.business} />
              </View>
              <View>
                <Text style={s.cardTitle}>Active Sessions</Text>
                <Text style={s.cardSub}>Devices logged into your account</Text>
              </View>
            </View>

            <View style={s.sessionRow}>
              <View style={[s.sessionIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="phone-portrait" size={16} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sessionDevice}>This Device</Text>
                <Text style={s.sessionMeta}>Current session · Active now</Text>
              </View>
              <View style={s.sessionDot} />
            </View>

            <Text style={s.noteText}>
              Full session management will be available in a future update.
            </Text>
          </View>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardTitle: { fontSize: typography.base, fontWeight: typography.bold, color: colors.textPrimary },
  cardSub: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 },

  fieldGroup: { gap: spacing.md },

  // ── Row with toggle ──
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rowTitle: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary },
  rowSub: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 },

  // ── Error / Success ──
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
  },
  successText: { flex: 1, fontSize: typography.sm, color: colors.success, fontWeight: typography.semibold },

  // ── Save button ──
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.personal,
    borderRadius: radius.lg,
    paddingVertical: 15,
    shadowColor: colors.personal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnDim: { opacity: 0.65 },
  saveBtnText: { fontSize: typography.base, fontWeight: typography.bold, color: '#fff' },

  // ── Sessions ──
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sessionDevice: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary },
  sessionMeta: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    flexShrink: 0,
  },

  noteText: {
    fontSize: typography.xs,
    color: colors.textTertiary,
    lineHeight: 18,
    paddingHorizontal: spacing.xs,
  },
});
