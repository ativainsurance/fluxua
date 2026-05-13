import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, typography, spacing, radius, shadows } from '../../theme';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Language'>;

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  available: boolean;
  note?: string;
}

const LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    available: true,
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    available: true,
    note: 'Brazilian Portuguese',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇲🇽',
    available: false,
    note: 'Coming soon',
  },
];

export default function LanguageScreen() {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState('en');

  const current = LANGUAGES.find(l => l.code === selected)!;

  return (
    <SafeAreaView style={s.safe}>
      <SubScreenHeader title="Language" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Current language banner ── */}
        <View style={s.currentCard}>
          <View style={s.currentLeft}>
            <Text style={s.currentFlag}>{current.flag}</Text>
            <View>
              <Text style={s.currentName}>{current.name}</Text>
              <Text style={s.currentNative}>{current.nativeName}</Text>
            </View>
          </View>
          <View style={s.activeBadge}>
            <View style={s.activeDot} />
            <Text style={s.activeLabel}>Active</Text>
          </View>
        </View>

        {/* ── Language list ── */}
        <View style={s.sectionWrapper}>
          <Text style={s.sectionLabel}>Available Languages</Text>
          <View style={s.card}>
            {LANGUAGES.map((lang, i) => {
              const isSelected = selected === lang.code;
              return (
                <React.Fragment key={lang.code}>
                  {i > 0 && <View style={s.divider} />}
                  <TouchableOpacity
                    style={[s.langRow, isSelected && s.langRowActive, !lang.available && s.langRowDisabled]}
                    onPress={() => lang.available && setSelected(lang.code)}
                    activeOpacity={lang.available ? 0.7 : 1}
                  >
                    <Text style={s.langFlag}>{lang.flag}</Text>
                    <View style={s.langInfo}>
                      <View style={s.langNameRow}>
                        <Text style={[s.langName, isSelected && { color: colors.teal }]}>
                          {lang.name}
                        </Text>
                        {lang.note && (
                          <View style={[
                            s.langBadge,
                            {
                              backgroundColor: lang.available
                                ? colors.tealLight
                                : colors.surfaceAlt,
                            }
                          ]}>
                            <Text style={[
                              s.langBadgeText,
                              { color: lang.available ? colors.teal : colors.textTertiary },
                            ]}>
                              {lang.note}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.langNative}>{lang.nativeName}</Text>
                    </View>

                    {isSelected ? (
                      <View style={s.checkCircle}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    ) : lang.available ? (
                      <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                    ) : (
                      <Ionicons name="lock-closed-outline" size={14} color={colors.textDisabled} />
                    )}
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* ── Portuguese note ── */}
        <View style={s.noteCard}>
          <View style={s.noteIconWrap}>
            <Text style={s.noteIcon}>🇧🇷</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.noteTitle}>Multilingual support</Text>
            <Text style={s.noteBody}>
              Fluxua is designed with bilingual users in mind. Portuguese (PT-BR) is fully supported alongside English for a seamless experience.
            </Text>
          </View>
        </View>

        {/* ── More coming ── */}
        <View style={s.comingSoonCard}>
          <Ionicons name="globe-outline" size={20} color={colors.textTertiary} />
          <Text style={s.comingSoonText}>
            More languages are on the roadmap. Spanish support is coming in a future update.
          </Text>
        </View>
      </ScrollView>
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

  // ── Current language banner ──
  currentCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.hero,
  },
  currentLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  currentFlag: { fontSize: 32, lineHeight: 38 },
  currentName: { fontSize: typography.md, fontWeight: typography.bold, color: '#fff', letterSpacing: -0.2 },
  currentNative: { fontSize: typography.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(20, 184, 166, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.35)',
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal },
  activeLabel: { fontSize: typography.xs, fontWeight: typography.semibold, color: colors.teal },

  // ── Section ──
  sectionWrapper: { gap: spacing.xs },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
    marginBottom: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.base + 36 + spacing.md },

  // ── Language row ──
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  langRowActive: { backgroundColor: colors.tealLight },
  langRowDisabled: { opacity: 0.55 },
  langFlag: { fontSize: 24, lineHeight: 28 },
  langInfo: { flex: 1, gap: 3 },
  langNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  langName: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary },
  langBadge: { borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  langBadgeText: { fontSize: 10, fontWeight: typography.semibold, letterSpacing: 0.2 },
  langNative: { fontSize: typography.xs, color: colors.textSecondary },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Note card ──
  noteCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.teal,
  },
  noteIconWrap: { flexShrink: 0, paddingTop: 2 },
  noteIcon: { fontSize: 22 },
  noteTitle: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.textPrimary, marginBottom: 4 },
  noteBody: { fontSize: typography.xs, color: colors.textSecondary, lineHeight: 18 },

  // ── Coming soon ──
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  comingSoonText: { flex: 1, fontSize: typography.xs, color: colors.textTertiary, lineHeight: 18 },
});
