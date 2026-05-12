import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUILT_IN_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';

const STORAGE_KEY = '@expense_tracker/custom_categories';

export interface CustomCategory {
  key: string;   // stored as expense.category
  label: string; // display name
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

  const addCategory = useCallback(async (label: string): Promise<string | null> => {
    const trimmed = label.trim();
    if (!trimmed) return null;

    // Derive a key from the label (lowercase, hyphens)
    const key = trimmed.toLowerCase().replace(/\s+/g, '-');

    // Don't add if it already exists as built-in or custom
    const isBuiltIn = (BUILT_IN_CATEGORIES as readonly string[]).includes(key);
    if (isBuiltIn) return key;

    setCustomCategories((prev) => {
      if (prev.find((c) => c.key === key)) return prev;
      const next = [...prev, { key, label: trimmed }];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // Register the new category in the shared label/icon maps
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

  return { customCategories, addCategory, removeCategory };
};
