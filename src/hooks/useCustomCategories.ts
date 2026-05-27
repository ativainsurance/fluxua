import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUILT_IN_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';

const STORAGE_KEY = '@expense_tracker/custom_categories';

export interface CustomCategory {
  key: string;    // stored as expense.category
  label: string;  // display name
  emoji?: string; // optional visual identity
}

export const useCustomCategories = () => {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        try {
          setCustomCategories(JSON.parse(json));
        } catch {
          // ignore corrupt data
        }
      }
    });
  }, []);

  const addCategory = useCallback(async (label: string, emoji?: string): Promise<string | null> => {
    const trimmed = label.trim();
    if (!trimmed) return null;

    const key = trimmed.toLowerCase().replace(/\s+/g, '-');

    const isBuiltIn = (BUILT_IN_CATEGORIES as readonly string[]).includes(key);
    if (isBuiltIn) return key;

    setCustomCategories((prev) => {
      const existing = prev.find((c) => c.key === key);
      if (existing) return prev;
      const entry: CustomCategory = { key, label: trimmed, ...(emoji ? { emoji } : {}) };
      const next = [...prev, entry];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      CATEGORY_LABELS[key] = trimmed;
      CATEGORY_ICONS[key] = 'tag-outline';
      return next;
    });

    return key;
  }, []);

  const removeCategory = useCallback(async (key: string) => {
    setCustomCategories((prev) => {
      const next = prev.filter((c) => c.key !== key);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /** Returns the emoji for a custom category key, or undefined if not set. */
  const getCategoryEmoji = useCallback(
    (key: string): string | undefined =>
      customCategories.find((c) => c.key === key)?.emoji,
    [customCategories]
  );

  return { customCategories, addCategory, removeCategory, getCategoryEmoji };
};
