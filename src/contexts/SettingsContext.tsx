import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { getLocales } from 'expo-localization';
import { supabase } from '../services/supabase';
import i18n from '../i18n';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type SupportedLanguage = 'en' | 'pt' | 'es';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'pt', 'es'];

function getDeviceLanguage(): SupportedLanguage {
  const code = getLocales()[0]?.languageCode ?? 'en';
  if (code.startsWith('pt')) return 'pt';
  if (code.startsWith('es')) return 'es';
  return 'en';
}

interface SettingsContextType {
  language: SupportedLanguage;
  currency: string;
  currencySymbol: string;
  settingsReady: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [currency, setCurrencyState] = useState('USD');
  const [settingsReady, setSettingsReady] = useState(false);

  const applySettings = useCallback((meta: Record<string, string>) => {
    const rawLang = meta.language as SupportedLanguage;
    const lang: SupportedLanguage =
      SUPPORTED_LANGUAGES.includes(rawLang) ? rawLang : getDeviceLanguage();
    const curr = meta.currency ?? 'USD';

    setLanguageState(lang);
    setCurrencyState(curr);
    void i18n.changeLanguage(lang);
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      applySettings((session?.user?.user_metadata ?? {}) as Record<string, string>);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      applySettings((session?.user?.user_metadata ?? {}) as Record<string, string>);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySettings]);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    void i18n.changeLanguage(lang);
    await supabase.auth.updateUser({ data: { language: lang } });
  }, []);

  const setCurrency = useCallback(async (curr: string) => {
    setCurrencyState(curr);
    await supabase.auth.updateUser({ data: { currency: curr } });
  }, []);

  const currencySymbol = useMemo(() => {
    try {
      return (
        new Intl.NumberFormat(language, { style: 'currency', currency })
          .formatToParts(0)
          .find((p) => p.type === 'currency')?.value ?? currency
      );
    } catch {
      return currency;
    }
  }, [language, currency]);

  return (
    <SettingsContext.Provider
      value={{ language, currency, currencySymbol, settingsReady, setLanguage, setCurrency }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
