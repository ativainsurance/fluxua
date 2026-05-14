import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { typography, spacing, radius, shadows } from '../../theme';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';

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
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', available: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', available: true, note: 'Brazilian Portuguese' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇲🇽', available: false, note: 'Coming soon' },
];

export default function LanguageScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [selected, setSelected] = useState('en');

  const current = LANGUAGES.find(l => l.code === selected)!;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SubScreenHeader title="Language" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xxxl, gap: spacing.base }} showsVerticalScrollIndicator={false}>

        {/* ── Current language banner ── */}
        <View style={{ backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...shadows.hero }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Text style={{ fontSize: 32, lineHeight: 38 }}>{current.flag}</Text>
            <View>
              <Text style={{ fontSize: typography.md, fontWeight: typography.bold, color: colors.textInverse, letterSpacing: -0.2 }}>{current.name}</Text>
              <Text style={{ fontSize: typography.xs, color: 'rgba(250,250,247,0.5)', marginTop: 2 }}>{current.nativeName}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.teal + '33', borderWidth: 1, borderColor: colors.teal + '55' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal }} />
            <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.teal }}>Active</Text>
          </View>
        </View>

        {/* ── Language list ── */}
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: spacing.xs, marginBottom: 2 }}>Available Languages</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', ...shadows.card }}>
            {LANGUAGES.map((lang, i) => {
              const isSelected = selected === lang.code;
              return (
                <React.Fragment key={lang.code}>
                  {i > 0 && <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: spacing.base + 36 + spacing.md }} />}
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: 14, gap: spacing.md, backgroundColor: isSelected ? colors.tealLight : colors.surface, opacity: lang.available ? 1 : 0.55 }}
                    onPress={() => lang.available && setSelected(lang.code)}
                    activeOpacity={lang.available ? 0.7 : 1}
                  >
                    <Text style={{ fontSize: 24, lineHeight: 28 }}>{lang.flag}</Text>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: typography.base, fontWeight: typography.semibold, color: isSelected ? colors.teal : colors.textPrimary }}>{lang.name}</Text>
                        {lang.note && (
                          <View style={{ borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: lang.available ? colors.tealLight : colors.surfaceAlt }}>
                            <Text style={{ fontSize: 10, fontWeight: typography.semibold, letterSpacing: 0.2, color: lang.available ? colors.teal : colors.textTertiary }}>{lang.note}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: typography.xs, color: colors.textSecondary }}>{lang.nativeName}</Text>
                    </View>

                    {isSelected ? (
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.teal, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="checkmark" size={14} color={colors.textInverse} />
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
        <View style={{ flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, ...shadows.sm, borderLeftWidth: 3, borderLeftColor: colors.teal }}>
          <View style={{ flexShrink: 0, paddingTop: 2 }}>
            <Text style={{ fontSize: 22 }}>🇧🇷</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.sm, fontWeight: typography.bold, color: colors.textPrimary, marginBottom: 4 }}>Multilingual support</Text>
            <Text style={{ fontSize: typography.xs, color: colors.textSecondary, lineHeight: 18 }}>
              Fluxua is designed with bilingual users in mind. Portuguese (PT-BR) is fully supported alongside English for a seamless experience.
            </Text>
          </View>
        </View>

        {/* ── More coming ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.base }}>
          <Ionicons name="globe-outline" size={20} color={colors.textTertiary} />
          <Text style={{ flex: 1, fontSize: typography.xs, color: colors.textTertiary, lineHeight: 18 }}>
            More languages are on the roadmap. Spanish support is coming in a future update.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
