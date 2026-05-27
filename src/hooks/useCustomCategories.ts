import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchCustomCategories,
  addCustomCategory,
  removeCustomCategory,
} from '../services/supabase';
import { CustomCategory, BUILT_IN_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';

const LEGACY_STORAGE_KEY = '@expense_tracker/custom_categories';

// ─────────────────────────────────────────────
// useCustomCategories — household-shared categories
// ─────────────────────────────────────────────

export const useCustomCategories = () => {
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  const loadAndMigrate = useCallback(async () => {
    if (!user || !householdId) return;

    const remote = await fetchCustomCategories(householdId);

    // One-time migration: if the user has categories in AsyncStorage not yet on the server, upload them.
    const legacyJson = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyJson) {
      try {
        type LegacyCategory = { key: string; label: string; emoji?: string };
        const legacy: LegacyCategory[] = JSON.parse(legacyJson);
        const remoteKeys = new Set(remote.map((c) => c.key));
        const toMigrate = legacy.filter(
          (lc) =>
            lc.key &&
            lc.label &&
            !(BUILT_IN_CATEGORIES as readonly string[]).includes(lc.key) &&
            !remoteKeys.has(lc.key)
        );
        if (toMigrate.length > 0) {
          await Promise.all(
            toMigrate.map((lc) =>
              addCustomCategory(user.id, householdId, lc.key, lc.label, lc.emoji)
            )
          );
          // Re-fetch after migration
          const updated = await fetchCustomCategories(householdId);
          setCustomCategories(updated);
          updated.forEach((c) => {
            CATEGORY_LABELS[c.key] = c.label;
            CATEGORY_ICONS[c.key] = 'tag-outline';
          });
        } else {
          setCustomCategories(remote);
          remote.forEach((c) => {
            CATEGORY_LABELS[c.key] = c.label;
            CATEGORY_ICONS[c.key] = 'tag-outline';
          });
        }
        // Clear legacy storage after successful migration
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        setCustomCategories(remote);
        remote.forEach((c) => {
          CATEGORY_LABELS[c.key] = c.label;
          CATEGORY_ICONS[c.key] = 'tag-outline';
        });
      }
    } else {
      setCustomCategories(remote);
      remote.forEach((c) => {
        CATEGORY_LABELS[c.key] = c.label;
        CATEGORY_ICONS[c.key] = 'tag-outline';
      });
    }
  }, [user, householdId]);

  useEffect(() => {
    loadAndMigrate();
  }, [loadAndMigrate]);

  const addCategory = useCallback(
    async (label: string, emoji?: string): Promise<string | null> => {
      if (!user || !householdId) return null;
      const trimmed = label.trim();
      if (!trimmed) return null;

      const key = trimmed.toLowerCase().replace(/\s+/g, '-');

      if ((BUILT_IN_CATEGORIES as readonly string[]).includes(key)) return key;

      // Optimistic update
      CATEGORY_LABELS[key] = trimmed;
      CATEGORY_ICONS[key] = 'tag-outline';

      try {
        const saved = await addCustomCategory(user.id, householdId, key, trimmed, emoji);
        setCustomCategories((prev) => {
          if (prev.find((c) => c.key === key)) return prev;
          return [...prev, saved];
        });
        return key;
      } catch {
        return null;
      }
    },
    [user, householdId]
  );

  const removeCategory = useCallback(
    async (key: string) => {
      if (!householdId) return;
      setCustomCategories((prev) => prev.filter((c) => c.key !== key));
      try {
        await removeCustomCategory(householdId, key);
      } catch {
        // Reload on error to restore state
        loadAndMigrate();
      }
    },
    [householdId, loadAndMigrate]
  );

  /** Returns the emoji for a custom category key, or undefined if not set. */
  const getCategoryEmoji = useCallback(
    (key: string): string | undefined =>
      customCategories.find((c) => c.key === key)?.emoji,
    [customCategories]
  );

  return { customCategories, addCategory, removeCategory, getCategoryEmoji };
};
