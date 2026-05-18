import { useTranslation } from 'react-i18next';
import { BUILT_IN_CATEGORIES } from '../types';
import { useCustomCategories } from '../hooks/useCustomCategories';

/**
 * Returns a locale-aware display label for a category value.
 * - Built-in IDs (e.g. 'housing') → translated via categories.* keys
 * - Custom slugs (e.g. 'pet-care') → display label stored in AsyncStorage (e.g. 'Pet Care')
 * - Unknown slugs → returned as-is (fallback)
 */
export function useCategoryLabel() {
  const { t } = useTranslation();
  const { customCategories } = useCustomCategories();
  return (categoryValue: string): string => {
    if ((BUILT_IN_CATEGORIES as readonly string[]).includes(categoryValue)) {
      return t(`categories.${categoryValue}`);
    }
    const custom = customCategories.find(c => c.key === categoryValue);
    return custom ? custom.label : categoryValue;
  };
}
