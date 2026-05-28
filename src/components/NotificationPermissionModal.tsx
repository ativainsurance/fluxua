import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { typography, spacing, radius, shadows } from '../theme';
import { requestNotificationPermission } from '../hooks/useNotifications';

interface Props {
  visible: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

export function NotificationPermissionModal({ visible, onAllow, onSkip }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleAllow = async () => {
    await requestNotificationPermission();
    onAllow();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="notifications" size={32} color={colors.warning} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('notifications.permModal.title')}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {t('notifications.permModal.body')}
          </Text>

          {/* Feature bullets */}
          {(['stmt', 'pay', 'autopay'] as const).map(key => (
            <View key={key} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.teal} />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                {t(`notifications.permModal.bullet_${key}`)}
              </Text>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.allowBtn, { backgroundColor: colors.primary }]}
            onPress={handleAllow}
            activeOpacity={0.8}
          >
            <Text style={[styles.allowText, { color: colors.textInverse }]}>
              {t('notifications.permModal.allow')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              {t('notifications.permModal.skip')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    ...shadows.hero,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: typography.sm,
    textAlign: 'center',
    lineHeight: 21,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.sm,
    lineHeight: 21,
  },
  allowBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  allowText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  skipText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
});
