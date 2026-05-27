import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useHousehold } from '../../contexts/HouseholdContext';
import { typography, spacing, radius, shadows } from '../../theme';

export default function HouseholdScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { household, members, reload } = useHousehold();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [copying, setCopying] = useState(false);
  const [reloading, setReloading] = useState(false);

  const handleShareCode = async () => {
    if (!household) return;
    setCopying(true);
    try {
      await Share.share({
        message: t('household.shareMessage', { code: household.join_code, name: household.name }),
      });
    } finally {
      setCopying(false);
    }
  };

  const handleReload = async () => {
    setReloading(true);
    try {
      await reload();
    } finally {
      setReloading(false);
    }
  };

  if (!household) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('household.title')}</Text>
          <TouchableOpacity
            onPress={handleReload}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {reloading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
            }
          </TouchableOpacity>
        </View>

        {/* Household card */}
        <View style={[styles.card, { backgroundColor: colors.navy }]}>
          <View style={styles.cardDecor1} />
          <View style={styles.cardDecor2} />
          <View style={styles.cardContent}>
            <View style={styles.cardIconRow}>
              <View style={styles.cardIconBg}>
                <Ionicons name="home" size={22} color={colors.teal} />
              </View>
              <Text style={styles.cardName}>{household.name}</Text>
            </View>
            <Text style={styles.cardMembersLabel}>
              {t('household.membersCount', { count: members.length })}
            </Text>
          </View>
        </View>

        {/* Join code section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('household.joinCodeLabel')}</Text>
          <View style={[styles.codeCard, { backgroundColor: colors.surface, ...shadows.card }]}>
            <Text style={[styles.codeText, { color: colors.primary }]}>{household.join_code}</Text>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: colors.primary }]}
              onPress={handleShareCode}
              disabled={copying}
            >
              <Ionicons name="share-outline" size={16} color={colors.textInverse} />
              <Text style={[styles.shareBtnText, { color: colors.textInverse }]}>
                {t('household.invite')}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.codeHint}>{t('household.joinCodeHint')}</Text>
        </View>

        {/* Members list */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('household.members')}</Text>
          <View style={[styles.membersCard, { backgroundColor: colors.surface, ...shadows.card }]}>
            {members.map((member, idx) => {
              const isMe = member.user_id === user?.id;
              const name = member.display_name ?? t('household.unknownMember');
              return (
                <View key={member.user_id}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                  <View style={styles.memberRow}>
                    <View style={[styles.avatar, { backgroundColor: isMe ? colors.primary + '22' : colors.surfaceAlt }]}>
                      <Text style={[styles.avatarText, { color: isMe ? colors.primary : colors.textSecondary }]}>
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {name}{isMe ? ` (${t('household.you')})` : ''}
                      </Text>
                      <Text style={styles.memberJoined}>
                        {t('household.joinedLabel', {
                          date: new Date(member.joined_at).toLocaleDateString(),
                        })}
                      </Text>
                    </View>
                    <View style={[
                      styles.roleBadge,
                      {
                        backgroundColor: member.role === 'owner'
                          ? colors.teal + '18'
                          : colors.surfaceAlt,
                      },
                    ]}>
                      <Text style={[
                        styles.roleText,
                        { color: member.role === 'owner' ? colors.teal : colors.textSecondary },
                      ]}>
                        {member.role === 'owner'
                          ? t('household.ownerBadge')
                          : t('household.memberBadge')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Info note */}
        <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            {t('household.sharedDataNote')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl,
    gap: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  card: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    padding: spacing.xl,
    ...shadows.hero,
  },
  cardDecor1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(250,250,247,0.06)',
  },
  cardDecor2: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(250,250,247,0.04)',
  },
  cardContent: { gap: spacing.sm },
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardIconBg: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(250,250,247,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardName: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: 'rgba(250,250,247,0.95)',
    flex: 1,
  },
  cardMembersLabel: {
    fontSize: typography.sm,
    color: 'rgba(250,250,247,0.5)',
    fontWeight: typography.medium,
  },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
  },
  codeCard: {
    borderRadius: radius.xl,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  codeText: {
    fontSize: 26,
    fontWeight: typography.bold,
    letterSpacing: 4,
    fontFamily: 'GeistMono-Medium',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  shareBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  codeHint: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    paddingHorizontal: spacing.xs,
  },
  membersCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  memberInfo: { flex: 1, gap: 2 },
  memberName: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.textPrimary,
  },
  memberJoined: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  roleBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  roleText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.base + 40 + spacing.md,
  },
  infoBox: {
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sm,
    lineHeight: 20,
  },
});
