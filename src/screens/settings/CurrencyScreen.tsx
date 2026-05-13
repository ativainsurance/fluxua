import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { typography, spacing, radius, shadows } from '../../theme';
import { SubScreenHeader } from '../../components/SubScreenHeader';
import { SettingsStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Currency'>;

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  locale: string;
  example: string;
}

const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', locale: 'en-US', example: '$1,234.56' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', locale: 'de-DE', example: '1.234,56 €' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', locale: 'en-GB', example: '£1,234.56' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', locale: 'pt-BR', example: 'R$ 1.234,56' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', locale: 'es-MX', example: '$1,234.56 MXN' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', locale: 'en-CA', example: 'CA$1,234.56' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', locale: 'en-AU', example: 'A$1,234.56' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', locale: 'ja-JP', example: '¥1,235' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', locale: 'de-CH', example: "Fr 1'234.56" },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', locale: 'es-CO', example: '$ 1.234,56 COP' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', locale: 'es-AR', example: '$ 1.234,56 ARS' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', locale: 'es-CL', example: '$1.235 CLP' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪', locale: 'es-PE', example: 'S/ 1,234.56' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', locale: 'en-IN', example: '₹1,234.56' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', locale: 'zh-CN', example: '¥1,234.56' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', locale: 'ko-KR', example: '₩1,235' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', locale: 'nb-NO', example: '1 234,56 kr' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', locale: 'sv-SE', example: '1 234,56 kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', locale: 'da-DK', example: '1.234,56 kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', locale: 'en-NZ', example: 'NZ$1,234.56' },
];

const CurrencyItem = ({ item, selected, onSelect }: { item: Currency; selected: boolean; onSelect: () => void }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: 13, gap: spacing.md, backgroundColor: selected ? colors.tealLight : colors.surface }}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 24, lineHeight: 28 }}>{item.flag}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ fontSize: typography.sm, fontWeight: typography.bold, color: selected ? colors.teal : colors.textPrimary, minWidth: 40 }}>{item.code}</Text>
          <Text style={{ fontSize: typography.sm, color: colors.textSecondary, flex: 1 }}>{item.name}</Text>
        </View>
        <Text style={{ fontSize: typography.xs, color: colors.textTertiary }}>{item.example}</Text>
      </View>
      {selected ? (
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.teal, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </View>
      ) : (
        <Text style={{ fontSize: typography.sm, fontWeight: typography.bold, color: colors.textDisabled, minWidth: 28, textAlign: 'right' }}>{item.symbol}</Text>
      )}
    </TouchableOpacity>
  );
};

export default function CurrencyScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [selected, setSelected] = useState('USD');
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.includes(q)
    );
  }, [query]);

  const selectedCurrency = CURRENCIES.find(c => c.code === selected)!;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SubScreenHeader title="Currency" onBack={() => navigation.goBack()} />

      <View style={{ flex: 1, gap: spacing.md, paddingTop: spacing.xs }}>
        {/* ── Preview card ── */}
        <View style={{ marginHorizontal: spacing.base, backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...shadows.hero }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Text style={{ fontSize: 32, lineHeight: 38 }}>{selectedCurrency.flag}</Text>
            <View>
              <Text style={{ fontSize: typography.lg, fontWeight: typography.bold, color: '#fff', letterSpacing: -0.3 }}>{selectedCurrency.code}</Text>
              <Text style={{ fontSize: typography.xs, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{selectedCurrency.name}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Text style={{ fontSize: typography.xs, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.4 }}>Example</Text>
            <Text style={{ fontSize: typography.md, fontWeight: typography.bold, color: colors.teal, letterSpacing: -0.2 }}>{selectedCurrency.example}</Text>
          </View>
        </View>

        {/* ── Search ── */}
        <View style={{ marginHorizontal: spacing.base, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 11, borderWidth: 1.5, borderColor: searchFocused ? colors.primary : colors.border, ...shadows.sm }}>
          <Ionicons name="search" size={16} color={searchFocused ? colors.primary : colors.textTertiary} />
          <TextInput
            style={{ flex: 1, fontSize: typography.base, color: colors.textPrimary, paddingVertical: 0 }}
            value={query}
            onChangeText={setQuery}
            placeholder="Search currencies…"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── List ── */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.code}
          renderItem={({ item, index }) => (
            <>
              {index > 0 && <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: spacing.base + 28 + spacing.md }} />}
              <CurrencyItem
                item={item}
                selected={item.code === selected}
                onSelect={() => setSelected(item.code)}
              />
            </>
          )}
          style={{ marginHorizontal: spacing.base, backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', ...shadows.card }}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: spacing.xxl }}>
              <Text style={{ fontSize: typography.sm, color: colors.textTertiary }}>No currencies match "{query}"</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
