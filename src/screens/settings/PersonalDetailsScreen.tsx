import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
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

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'PersonalDetails'>;

// ── Account type options ──
const ACCOUNT_TYPES = [
  { key: 'personal', label: 'Personal', icon: 'person-outline', color: colors.personal, bg: colors.personalLight },
  { key: 'business', label: 'Business', icon: 'briefcase-outline', color: colors.business, bg: colors.businessLight },
  { key: 'both', label: 'Personal & Business', icon: 'people-outline', color: colors.teal, bg: colors.tealLight },
] as const;

// ── Labeled input ──
const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  autoCapitalize = 'words',
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  editable?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={ff.wrapper}>
      <Text style={ff.label}>{label}</Text>
      <TextInput
        style={[ff.input, focused && ff.inputFocused, !editable && ff.inputDisabled]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        autoCapitalize={autoCapitalize}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="next"
      />
    </View>
  );
};

const ff = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: 13,
    fontSize: typography.base,
    color: colors.textPrimary,
    fontWeight: typography.medium,
    ...shadows.sm,
  },
  inputFocused: { borderColor: colors.primary, ...shadows.sm },
  inputDisabled: { backgroundColor: colors.surfaceAlt, color: colors.textSecondary },
});

export default function PersonalDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const [firstName, setFirstName] = useState(meta.first_name ?? '');
  const [lastName, setLastName] = useState(meta.last_name ?? '');
  const [displayName, setDisplayName] = useState(meta.display_name ?? meta.first_name ?? '');
  const [accountType, setAccountType] = useState<'personal' | 'business' | 'both'>(
    (meta.account_type as 'personal' | 'business' | 'both') ?? 'personal'
  );

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const successAnim = useRef(new Animated.Value(0)).current;

  const initials = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || displayName[0]?.toUpperCase() || 'U';

  const validate = () => {
    if (!firstName.trim()) return 'First name is required.';
    if (!displayName.trim()) return 'Display name is required.';
    return '';
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const { error: supaErr } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: displayName.trim(),
          account_type: accountType,
        },
      });
      if (supaErr) throw supaErr;
      setSaved(true);
      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(successAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start(() => setSaved(false));
    } catch (e: any) {
      setError(e.message ?? 'Failed to save. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <SubScreenHeader title="Personal Details" onBack={() => navigation.goBack()} />
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
          {/* ── Avatar ── */}
          <View style={s.avatarSection}>
            <View style={s.avatarRing}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
            </View>
            <TouchableOpacity style={s.avatarEditBtn} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={14} color={colors.primary} />
              <Text style={s.avatarEditLabel}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* ── Name fields ── */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>Name</Text>
            <View style={s.fieldGroup}>
              <FormField label="First Name" value={firstName} onChange={setFirstName} placeholder="e.g. Leticia" />
              <FormField label="Last Name" value={lastName} onChange={setLastName} placeholder="e.g. Zuany" />
              <FormField label="Display Name" value={displayName} onChange={setDisplayName} placeholder="How others see you" />
            </View>
          </View>

          {/* ── Account type ── */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>Account Type</Text>
            <View style={s.typeRow}>
              {ACCOUNT_TYPES.map((t) => {
                const active = accountType === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[s.typeBtn, active && { borderColor: t.color, backgroundColor: t.bg }]}
                    onPress={() => setAccountType(t.key)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={t.icon as any} size={18} color={active ? t.color : colors.textTertiary} />
                    <Text style={[s.typeBtnLabel, { color: active ? t.color : colors.textSecondary }]}>
                      {t.label}
                    </Text>
                    {active && (
                      <View style={[s.typeCheck, { backgroundColor: t.color }]}>
                        <Ionicons name="checkmark" size={9} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Error ── */}
          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Success toast ── */}
          <Animated.View
            style={[s.successToast, {
              opacity: successAnim,
              transform: [{ translateY: successAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            }]}
            pointerEvents="none"
          >
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={s.successText}>Changes saved successfully</Text>
          </Animated.View>

          {/* ── Save button ── */}
          <TouchableOpacity
            style={[s.saveBtn, loading && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={s.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
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

  // ── Avatar ──
  avatarSection: { alignItems: 'center', paddingVertical: spacing.base, gap: spacing.sm },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: colors.teal + '55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  avatarText: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: '#fff',
    letterSpacing: -1,
  },
  avatarEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    backgroundColor: colors.primaryLight,
  },
  avatarEditLabel: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.primary },

  // ── Card ──
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
    marginBottom: 2,
  },
  fieldGroup: { gap: spacing.md },

  // ── Account type ──
  typeRow: { gap: spacing.sm },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  typeBtnLabel: { flex: 1, fontSize: typography.sm, fontWeight: typography.semibold },
  typeCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

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

  // ── Success ──
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
  },
  successText: { fontSize: typography.sm, color: colors.success, fontWeight: typography.semibold },

  // ── Save button ──
  saveBtn: {
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
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { fontSize: typography.base, fontWeight: typography.bold, color: '#fff', letterSpacing: -0.2 },
});
