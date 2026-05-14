import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { typography, spacing, radius, shadows } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'PersonalDetails'>;

const ACCOUNT_TYPES = [
  { key: 'personal', label: 'Personal', icon: 'person-outline' as const },
  { key: 'business', label: 'Business', icon: 'briefcase-outline' as const },
  { key: 'both', label: 'Personal & Business', icon: 'people-outline' as const },
] as const;

const FormField = ({ label, value, onChange, placeholder, autoCapitalize = 'words' as const, editable = true }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; autoCapitalize?: 'none' | 'words' | 'sentences'; editable?: boolean;
}) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: spacing.xs }}>{label}</Text>
      <TextInput
        style={{ backgroundColor: editable ? (focused ? colors.surface : colors.surfaceAlt) : colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1.5, borderColor: focused ? colors.primary : colors.border, paddingHorizontal: spacing.base, paddingVertical: 13, fontSize: typography.base, color: editable ? colors.textPrimary : colors.textSecondary, fontWeight: typography.medium }}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={colors.textDisabled} autoCapitalize={autoCapitalize}
        editable={editable} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} returnKeyType="next"
      />
    </View>
  );
};

export default function PersonalDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const [firstName, setFirstName] = useState(meta.first_name ?? '');
  const [lastName, setLastName] = useState(meta.last_name ?? '');
  const [displayName, setDisplayName] = useState(meta.display_name ?? meta.first_name ?? '');
  const [accountType, setAccountType] = useState<'personal' | 'business' | 'both'>((meta.account_type as any) ?? 'personal');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const successAnim = useRef(new Animated.Value(0)).current;
  const initials = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || displayName[0]?.toUpperCase() || 'U';

  const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
    personal: { color: colors.personal, bg: colors.personalLight },
    business: { color: colors.business, bg: colors.businessLight },
    both: { color: colors.teal, bg: colors.tealLight },
  };

  const validate = () => {
    if (!firstName.trim()) return 'First name is required.';
    if (!displayName.trim()) return 'Display name is required.';
    return '';
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setLoading(true);
    try {
      const { error: supaErr } = await supabase.auth.updateUser({ data: { first_name: firstName.trim(), last_name: lastName.trim(), display_name: displayName.trim(), account_type: accountType } });
      if (supaErr) throw supaErr;
      setSaved(true);
      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(successAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start(() => setSaved(false));
    } catch (e: any) { setError(e.message ?? 'Failed to save.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SubScreenHeader title="Personal Details" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xxxl, gap: spacing.base }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <View style={{ alignItems: 'center', paddingVertical: spacing.base, gap: spacing.sm }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 2.5, borderColor: colors.teal + '55', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center', ...shadows.md }}>
                <Text style={{ fontSize: typography.xxl, fontWeight: typography.bold, color: colors.textInverse, letterSpacing: -1 }}>{initials}</Text>
              </View>
            </View>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary + '44', backgroundColor: colors.primaryLight }} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={14} color={colors.primary} />
              <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: colors.primary }}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Name fields */}
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, ...shadows.card }}>
            <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' }}>Name</Text>
            <View style={{ gap: spacing.md }}>
              <FormField label="First Name" value={firstName} onChange={setFirstName} placeholder="e.g. Leticia" />
              <FormField label="Last Name" value={lastName} onChange={setLastName} placeholder="e.g. Zuany" />
              <FormField label="Display Name" value={displayName} onChange={setDisplayName} placeholder="How others see you" />
            </View>
          </View>

          {/* Account type */}
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, ...shadows.card }}>
            <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' }}>Account Type</Text>
            <View style={{ gap: spacing.sm }}>
              {ACCOUNT_TYPES.map(t => {
                const active = accountType === t.key;
                const tc = TYPE_COLORS[t.key];
                return (
                  <TouchableOpacity key={t.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base, paddingVertical: 13, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? tc.color : colors.border, backgroundColor: active ? tc.bg : colors.surfaceAlt }} onPress={() => setAccountType(t.key as any)} activeOpacity={0.75}>
                    <Ionicons name={t.icon} size={18} color={active ? tc.color : colors.textTertiary} />
                    <Text style={{ flex: 1, fontSize: typography.sm, fontWeight: typography.semibold, color: active ? tc.color : colors.textSecondary }}>{t.label}</Text>
                    {active && <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: tc.color, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="checkmark" size={9} color={colors.textInverse} /></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {error ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerLight, borderRadius: radius.md, paddingHorizontal: spacing.base, paddingVertical: 10 }}><Ionicons name="alert-circle-outline" size={15} color={colors.danger} /><Text style={{ flex: 1, fontSize: typography.sm, color: colors.danger }}>{error}</Text></View> : null}

          <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successLight, borderRadius: radius.md, paddingHorizontal: spacing.base, paddingVertical: 10, opacity: successAnim, transform: [{ translateY: successAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }} pointerEvents="none">
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={{ fontSize: typography.sm, color: colors.success, fontWeight: typography.semibold }}>Changes saved successfully</Text>
          </Animated.View>

          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 15, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 4, opacity: loading ? 0.65 : 1 }} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator size="small" color={colors.textInverse} /> : <><Ionicons name="checkmark-circle-outline" size={18} color={colors.textInverse} /><Text style={{ fontSize: typography.base, fontWeight: typography.bold, color: colors.textInverse }}>Save Changes</Text></>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
