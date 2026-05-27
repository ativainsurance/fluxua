import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isSupabaseConfigured } from '../services/supabase';
import { typography, spacing, radius } from '../theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import FlowScreen from '../screens/FlowScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BudgetScreen from '../screens/BudgetScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';

// Settings sub-screens
import PersonalDetailsScreen from '../screens/settings/PersonalDetailsScreen';
import EmailScreen from '../screens/settings/EmailScreen';
import SecurityScreen from '../screens/settings/SecurityScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';
import CurrencyScreen from '../screens/settings/CurrencyScreen';
import LanguageScreen from '../screens/settings/LanguageScreen';
import HelpFaqScreen from '../screens/settings/HelpFaqScreen';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';

import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  SettingsStackParamList,
} from './types';

// ─────────────────────────────────────────────
// Stack Navigators
// ─────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

// ── Settings stack navigator ──
const SettingsNavigator = () => (
  <SettingsStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
    <SettingsStack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
    <SettingsStack.Screen name="Email" component={EmailScreen} />
    <SettingsStack.Screen name="Security" component={SecurityScreen} />
    <SettingsStack.Screen name="Notifications" component={NotificationsScreen} />
    <SettingsStack.Screen name="Currency" component={CurrencyScreen} />
    <SettingsStack.Screen name="Language" component={LanguageScreen} />
    <SettingsStack.Screen name="HelpFaq" component={HelpFaqScreen} />
    <SettingsStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
  </SettingsStack.Navigator>
);

const MainNavigator = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <MainTab.Navigator
      initialRouteName="Flow"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
          shadowColor: colors.navy,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { active: string; inactive: string }> = {
            Flow: { active: 'pulse', inactive: 'pulse-outline' },
            Commitments: { active: 'receipt', inactive: 'receipt-outline' },
            Overview: { active: 'grid', inactive: 'grid-outline' },
            Budget: { active: 'pie-chart', inactive: 'pie-chart-outline' },
            Settings: { active: 'settings', inactive: 'settings-outline' },
          };
          const icon = icons[route.name];
          const name = (focused ? icon?.active : icon?.inactive) ?? 'ellipse';
          return <Ionicons name={name as any} size={focused ? size + 1 : size} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Flow" component={FlowScreen} options={{ tabBarLabel: t('nav.flow') }} />
      <MainTab.Screen name="Commitments" component={ExpensesScreen} options={{ tabBarLabel: t('nav.commitments') }} />
      <MainTab.Screen name="Overview" component={DashboardScreen} options={{ tabBarLabel: t('nav.overview') }} />
      <MainTab.Screen name="Budget" component={BudgetScreen} options={{ tabBarLabel: t('nav.budget') }} />
      <MainTab.Screen name="Settings" component={SettingsNavigator} options={{ tabBarLabel: t('nav.settings') }} />
    </MainTab.Navigator>
  );
};

// ─────────────────────────────────────────────
// Root Navigator — decides Auth vs Main
// ─────────────────────────────────────────────

const LoadingScreen = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

/* eslint-disable i18next/no-literal-string */
const SetupScreen = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: spacing.xl, gap: spacing.md }}>
      <Ionicons name="warning-outline" size={48} color={colors.warning} />
      <Text style={{ fontSize: typography.lg, fontWeight: typography.bold, color: colors.textPrimary, textAlign: 'center' }}>Supabase Not Configured</Text>
      <Text style={{ fontSize: typography.sm, color: colors.textSecondary, textAlign: 'center' }}>
        Create a <Text style={{ fontFamily: 'monospace', color: colors.primary }}>.env</Text> file in the project root with your Supabase credentials:
      </Text>
      <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, width: '100%' }}>
        <Text style={{ fontFamily: 'monospace', fontSize: typography.sm, color: colors.primary }}>
          EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co{'\n'}EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
        </Text>
      </View>
      <Text style={{ fontSize: typography.sm, color: colors.textSecondary, textAlign: 'center' }}>
        Then restart the dev server with <Text style={{ fontFamily: 'monospace', color: colors.primary }}>npx expo start</Text>
      </Text>
      <Text style={{ fontSize: typography.xs, color: colors.textDisabled, textAlign: 'center' }}>See SETUP.md for full instructions.</Text>
    </View>
  );
};

/* eslint-enable i18next/no-literal-string */

export const AppNavigator = () => {
  const { session, loading } = useAuth();

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

