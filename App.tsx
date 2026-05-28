import 'react-native-url-polyfill/auto';
import './src/i18n';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
} from '@expo-google-fonts/geist-mono';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { HouseholdProvider, useHousehold } from './src/contexts/HouseholdContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { SettingsProvider, useSettings } from './src/contexts/SettingsContext';
import { AppNavigator } from './src/navigation';
import { NotificationPermissionModal } from './src/components/NotificationPermissionModal';
import { hasNeverAskedPermission, getNotificationPermissionStatus, useNotificationScheduler } from './src/hooks/useNotifications';
import { useNotificationPrefs } from './src/hooks/useNotificationPrefs';
import { fetchExpenses, fetchExpenseRecords } from './src/services/supabase';
import { Expense, ExpenseRecord } from './src/types';
import { getCurrentMonthYear } from './src/utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSION_ASKED_KEY = '@fluxua/notif_permission_asked';

/** Lightweight background layer — fetches expenses once and schedules notifications */
function NotificationSyncLayer() {
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const { prefs } = useNotificationPrefs();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const { month, year } = getCurrentMonthYear();

  useEffect(() => {
    if (!user || !householdId || Platform.OS === 'web') return;
    (async () => {
      try {
        const [exp, rec] = await Promise.all([
          fetchExpenses(householdId),
          fetchExpenseRecords(householdId, month, year),
        ]);
        setExpenses(exp);
        setRecords(rec);
      } catch {
        // non-critical — scheduling degrades gracefully
      }
    })();
  }, [user, householdId, month, year]);

  useNotificationScheduler({
    expenses,
    records,
    prefs,
    userId: user?.id ?? '',
    month,
    year,
    enabled: Boolean(user && householdId),
  });

  return null;
}

function ThemedApp() {
  const { isDark } = useTheme();
  const { settingsReady } = useSettings();
  const [showPermModal, setShowPermModal] = useState(false);
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    // Show permission modal once to logged-in users who haven't been asked yet
    let cancelled = false;
    (async () => {
      const neverAsked = await hasNeverAskedPermission();
      if (!neverAsked) return;
      const status = await getNotificationPermissionStatus();
      if (status === 'undetermined' && !cancelled) {
        // Small delay so the UI is fully rendered first
        setTimeout(() => setShowPermModal(true), 2000);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      _response => {
        // Navigation deep-link handled here if needed in future
      }
    );
    return () => { responseListenerRef.current?.remove(); };
  }, []);

  const dismissPermModal = useCallback(async () => {
    await AsyncStorage.setItem(PERMISSION_ASKED_KEY, '1');
    setShowPermModal(false);
  }, []);

  if (!settingsReady) return null;
  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NotificationPermissionModal
        visible={showPermModal}
        onAllow={dismissPermModal}
        onSkip={dismissPermModal}
      />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Geist-Regular': Geist_400Regular,
    'Geist-Medium': Geist_500Medium,
    'Geist-SemiBold': Geist_600SemiBold,
    'Geist-Bold': Geist_700Bold,
    'Geist-ExtraBold': Geist_800ExtraBold,
    'GeistMono-Regular': GeistMono_400Regular,
    'GeistMono-Medium': GeistMono_500Medium,
  });

  // Hold splash until fonts are ready
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ThemeProvider>
            <AuthProvider>
              <HouseholdProvider>
                <NotificationSyncLayer />
                <ThemedApp />
              </HouseholdProvider>
            </AuthProvider>
          </ThemeProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
