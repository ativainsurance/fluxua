import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../contexts/ThemeContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useAuth } from '../contexts/AuthContext';
import { typography, spacing, radius, shadows } from '../theme';

type Mode = 'pick' | 'create' | 'join';

export default function HouseholdOnboardingScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { createHousehold, joinHousehold } = useHousehold();
  const { signOut } = useAuth();

  const [mode, setMode] = useState<Mode>('pick');
  const [householdName, setHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const styles = makeStyles(colors);

  const handleCreate = async () => {
    const name = householdName.trim();
    if (!name) { setError(t('household.errorNameRequired')); return; }
    setError('');
    setLoading(true);
    try {
      await createHousehold(name);
      // Navigation happens automatically — HouseholdContext updates and AppNavigator switches to Main.
    } catch {
      setError(t('household.errorCreateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim();
    if (!code) { setError(t('household.errorCodeRequired')); return; }
    setError('');
    setLoading(true);
    try {
      await joinHousehold(code);
    } catch {
      setError(t('household.errorJoinFailed'));
    } finally {
      setLoading(false);
    }
  };

  const renderPick = () => (
    <View style={styles.pickContainer}>
      <View style={styles.icon}>
        <Ionicons name="home" size={40} color={colors.teal} />
      </View>
      <Text style={styles.onboardTitle}>{t('household.onboardingTitle')}</Text>
      <Text style={styles.onboardSubtitle}>{t('household.onboardingSubtitle')}</Text>

      <View style={styles.pickButtons}>
        <TouchableOpacity
          style={[styles.pickBtn, { backgroundColor: colors.primary }]}
          onPress={() => setMode('create')}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.textInverse} />
          <Text style={[styles.pickBtnText, { color: colors.textInverse }]}>
            {t('household.createHousehold')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pickBtn, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border }]}
          onPress={() => setMode('join')}
        >
          <Ionicons name="enter-outline" size={20} color={colors.textPrimary} />
          <Text style={[styles.pickBtnText, { color: colors.textPrimary }]}>
            {t('household.joinHousehold')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={signOut} style={styles.signOutLink}>
        <Text style={styles.signOutText}>{t('settings.logOut')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreate = () => (
    <View style={styles.formContainer}>
      <TouchableOpacity style={styles.backRow} onPress={() => { setMode('pick'); setError(''); }}>
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        <Text style={styles.backText}>{t('common.back')}</Text>
      </TouchableOpacity>

      <Text style={styles.formTitle}>{t('household.createHousehold')}</Text>

      <Text style={styles.fieldLabel}>{t('household.householdNameLabel')}</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
        value={householdName}
        onChangeText={setHouseholdName}
        placeholder={t('household.householdNamePlaceholder')}
        placeholderTextColor={colors.textDisabled}
        returnKeyType="done"
        onSubmitEditing={handleCreate}
        autoFocus
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.textInverse} />
          : <>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.textInverse} />
              <Text style={[styles.submitBtnText, { color: colors.textInverse }]}>
                {t('household.createHousehold')}
              </Text>
            </>
        }
      </TouchableOpacity>
    </View>
  );

  const renderJoin = () => (
    <View style={styles.formContainer}>
      <TouchableOpacity style={styles.backRow} onPress={() => { setMode('pick'); setError(''); }}>
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        <Text style={styles.backText}>{t('common.back')}</Text>
      </TouchableOpacity>

      <Text style={styles.formTitle}>{t('household.joinHousehold')}</Text>

      <Text style={styles.fieldLabel}>{t('household.joinCodeLabel')}</Text>
      <TextInput
        style={[styles.input, styles.codeInput, { borderColor: colors.border, color: colors.primary, backgroundColor: colors.surface }]}
        value={joinCode}
        onChangeText={(v) => setJoinCode(v.toUpperCase())}
        placeholder={t('household.joinCodePlaceholder')}
        placeholderTextColor={colors.textDisabled}
        autoCapitalize="characters"
        maxLength={8}
        returnKeyType="done"
        onSubmitEditing={handleJoin}
        autoFocus
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: colors.teal, opacity: loading ? 0.6 : 1 }]}
        onPress={handleJoin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.textInverse} />
          : <>
              <Ionicons name="enter-outline" size={18} color={colors.textInverse} />
              <Text style={[styles.submitBtnText, { color: colors.textInverse }]}>
                {t('household.joinHousehold')}
              </Text>
            </>
        }
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === 'pick' && renderPick()}
          {mode === 'create' && renderCreate()}
          {mode === 'join' && renderJoin()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  pickContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxxl,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.tealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  onboardTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  onboardSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  pickButtons: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  pickBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  signOutLink: {
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  signOutText: {
    fontSize: typography.sm,
    color: colors.textDisabled,
    textDecorationLine: 'underline',
  },
  formContainer: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  formTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: -spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.base,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: typography.bold,
    letterSpacing: 6,
    textAlign: 'center',
    fontFamily: 'GeistMono-Medium',
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.danger,
    marginTop: -spacing.xs,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  submitBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
});
