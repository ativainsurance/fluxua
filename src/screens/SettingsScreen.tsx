import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { typography, spacing, radius, shadows } from '../theme';
import { SettingsStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

// ── Row ──────────────────────────────────────────────────
type RowRight =
  | { type: 'chevron' }
  | { type: 'value'; text: string }
  | { type: 'toggle'; value: boolean; onChange: (v: boolean) => void }
  | { type: 'badge'; text: string; color: string };

const SettingsRow = ({ icon, iconColor, iconBg, label, right, onPress, danger = false, isFirst = false }: {
  icon: string; iconColor: string; iconBg: string; label: string;
  right?: RowRight; onPress?: () => void; danger?: boolean; isFirst?: boolean;
}) => {
  const { colors } = useTheme();
  const labelColor = danger ? colors.danger : colors.textPrimary;
  const renderRight = () => {
    if (!right) return null;
    switch (right.type) {
      case 'chevron': return <Ionicons name="chevron-forward" size={16} color={danger ? colors.danger : colors.textDisabled} />;
      case 'value': return <Text style={{ fontSize: typography.sm, color: colors.textSecondary, maxWidth: 150 }} numberOfLines={1}>{right.text}</Text>;
      case 'toggle': return <Switch value={right.value} onValueChange={right.onChange} trackColor={{ false: colors.border, true: colors.teal }} thumbColor={colors.textInverse} style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />;
      case 'badge': return <View style={{ borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: right.color + '18' }}><Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: right.color }}>{right.text}</Text></View>;
    }
  };
  return (
    <>
      {!isFirst && <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: spacing.base + 36 + spacing.md }} />}
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: 14, gap: spacing.md }} onPress={onPress} activeOpacity={onPress ? 0.6 : 1} disabled={!onPress}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={{ flex: 1, fontSize: typography.base, fontWeight: typography.medium, color: labelColor }}>{label}</Text>
        <View style={{ flexShrink: 0, alignItems: 'flex-end' }}>{renderRight()}</View>
      </TouchableOpacity>
    </>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: spacing.xs, marginBottom: 2 }}>{label}</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', ...shadows.card }}>{children}</View>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────
export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { language: lang, currency: curr } = useSettings();
  const { household, members } = useHousehold();
  const [loading, setLoading] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const handleSignOut = async () => {
    setSignOutError(''); setLoading(true);
    try { await signOut(); }
    catch { setSignOutError(t('settings.failedSignOut')); setLoading(false); }
  };

  const emailDisplay = user?.email ?? '';
  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const displayName = meta.display_name ?? meta.first_name ?? emailDisplay.split('@')[0] ?? 'User';
  const languageLabel = lang === 'pt' ? 'Português' : lang === 'es' ? 'Español' : 'English';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xxxl, gap: spacing.base }} showsVerticalScrollIndicator={false}>

        {/* Title */}
        <View style={{ paddingTop: spacing.md }}>
          <Text style={{ fontSize: typography.xl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: -0.3 }}>{t('settings.title')}</Text>
        </View>

        {/* Profile Card */}
        <TouchableOpacity style={{ backgroundColor: colors.navy, borderRadius: radius.xxl, overflow: 'hidden', ...shadows.hero }} onPress={() => navigation.navigate('PersonalDetails')} activeOpacity={0.88}>
          <View style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.teal, opacity: 0.14 }} />
          <View style={{ position: 'absolute', bottom: -50, left: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.primary, opacity: 0.11 }} />
          <View style={{ position: 'absolute', top: -30, right: -30, width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: 'rgba(250,250,247,0.05)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.base, padding: spacing.xl, paddingVertical: spacing.xxl }}>
            <View style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: 'rgba(250,250,247,0.15)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
              <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(250,250,247,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: typography.xl, fontWeight: typography.bold, color: colors.textInverse, letterSpacing: -0.5 }}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: typography.md, fontWeight: typography.bold, color: colors.textInverse, textTransform: 'capitalize', letterSpacing: -0.2 }}>{displayName}</Text>
              <Text style={{ fontSize: typography.sm, color: 'rgba(250,250,247,0.55)' }} numberOfLines={1}>{emailDisplay}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.teal }} />
                <Text style={{ fontSize: typography.xs, color: colors.teal, fontWeight: typography.semibold, letterSpacing: 0.2 }}>{t('settings.personalBusiness')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(250,250,247,0.4)" />
          </View>
        </TouchableOpacity>

        {/* Household */}
        <Section label={t('settings.household')}>
          <SettingsRow
            icon="people-outline"
            iconColor={colors.teal}
            iconBg={colors.tealLight}
            label={t('settings.householdLabel')}
            right={{
              type: 'value',
              text: household?.name ?? t('settings.householdNotSetUp'),
            }}
            onPress={() => navigation.navigate('Household')}
            isFirst
          />
          {members.length > 0 && (
            <SettingsRow
              icon="person-add-outline"
              iconColor={colors.primary}
              iconBg={colors.primaryLight}
              label={t('settings.householdMembers', { count: members.length })}
              right={{ type: 'chevron' }}
              onPress={() => navigation.navigate('Household')}
            />
          )}
        </Section>

        {/* Account */}
        <Section label={t('settings.account')}>
          <SettingsRow icon="person-outline" iconColor={colors.primary} iconBg={colors.primaryLight} label={t('settings.personalDetails')} right={{ type: 'chevron' }} onPress={() => navigation.navigate('PersonalDetails')} isFirst />
          <SettingsRow icon="mail-outline" iconColor={colors.primary} iconBg={colors.primaryLight} label={t('settings.email')} right={{ type: 'value', text: emailDisplay }} onPress={() => navigation.navigate('Email')} />
          <SettingsRow icon="shield-outline" iconColor={colors.personal} iconBg={colors.personalLight} label={t('settings.security')} right={{ type: 'chevron' }} onPress={() => navigation.navigate('Security')} />
        </Section>

        {/* Preferences */}
        <Section label={t('settings.preferences')}>
          <SettingsRow icon="moon-outline" iconColor={colors.navy} iconBg={colors.surfaceAlt} label={t('settings.darkMode')} right={{ type: 'toggle', value: isDark, onChange: () => toggleTheme() }} onPress={() => toggleTheme()} isFirst />
          <SettingsRow icon="notifications-outline" iconColor={colors.warning} iconBg={colors.warningLight} label={t('settings.notifications')} right={{ type: 'chevron' }} onPress={() => navigation.navigate('Notifications')} />
          <SettingsRow icon="cash-outline" iconColor={colors.success} iconBg={colors.successLight} label={t('settings.currency')} right={{ type: 'value', text: curr }} onPress={() => navigation.navigate('Currency')} />
          <SettingsRow icon="language-outline" iconColor={colors.teal} iconBg={colors.tealLight} label={t('settings.language')} right={{ type: 'value', text: languageLabel }} onPress={() => navigation.navigate('Language')} />
        </Section>

        {/* Support */}
        <Section label={t('settings.support')}>
          <SettingsRow icon="help-circle-outline" iconColor={colors.business} iconBg={colors.businessLight} label={t('settings.helpFaq')} right={{ type: 'chevron' }} onPress={() => navigation.navigate('HelpFaq')} isFirst />
          <SettingsRow icon="lock-closed-outline" iconColor={colors.textSecondary} iconBg={colors.surfaceAlt} label={t('settings.privacyPolicy')} right={{ type: 'chevron' }} onPress={() => navigation.navigate('PrivacyPolicy')} />
          <SettingsRow icon="star-outline" iconColor={colors.warning} iconBg={colors.warningLight} label={t('settings.rateApp')} right={{ type: 'badge', text: t('common.new'), color: colors.teal }} onPress={() => {}} />
        </Section>

        {/* App */}
        <Section label={t('settings.app')}>
          <SettingsRow icon="information-circle-outline" iconColor={colors.textSecondary} iconBg={colors.surfaceAlt} label={t('settings.appVersion')} right={{ type: 'value', text: '1.0.0' }} isFirst />
        </Section>

        {/* Sign out */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', ...shadows.card }}>
          {!confirmSignOut ? (
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: 14, gap: spacing.md, backgroundColor: colors.dangerLight }} onPress={() => setConfirmSignOut(true)} activeOpacity={0.7}>
              <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.danger + '22', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              </View>
              <Text style={{ flex: 1, fontSize: typography.base, fontWeight: typography.semibold, color: colors.danger }}>{t('settings.logOut')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.danger} />
            </TouchableOpacity>
          ) : (
            <View style={{ padding: spacing.base, gap: spacing.md, backgroundColor: colors.dangerLight }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.danger + '22', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                </View>
                <View>
                  <Text style={{ fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary }}>{t('settings.signOutTitle')}</Text>
                  <Text style={{ fontSize: typography.sm, color: colors.textSecondary, marginTop: 1 }}>{t('settings.signOutSub')}</Text>
                </View>
              </View>
              {signOutError ? <Text style={{ fontSize: typography.sm, color: colors.danger }}>{signOutError}</Text> : null}
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', backgroundColor: colors.surface }} onPress={() => { setConfirmSignOut(false); setSignOutError(''); }} activeOpacity={0.7}>
                  <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textSecondary }}>{t('settings.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: colors.danger, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, opacity: loading ? 0.6 : 1, shadowColor: colors.danger, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 3 }} onPress={handleSignOut} disabled={loading} activeOpacity={0.7}>
                  <Ionicons name="log-out-outline" size={14} color={colors.textInverse} />
                  <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textInverse }}>{loading ? t('settings.signingOut') : t('settings.signOut')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', gap: 4, paddingTop: spacing.xs }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal, opacity: 0.55 }} />
          <Text style={{ fontSize: typography.xs, color: colors.textDisabled, fontWeight: typography.medium }}>{t('settings.footerTagline')}</Text>
          <Text style={{ fontSize: 10, color: colors.textDisabled, opacity: 0.7 }}>{t('settings.footerSignature')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
