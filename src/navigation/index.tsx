import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';
import { colors, typography, spacing, radius } from '../theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import FlowScreen from '../screens/FlowScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';

import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from './types';

// ─────────────────────────────────────────────
// Stack Navigators
// ─────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
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
          Settings: { active: 'settings', inactive: 'settings-outline' },
        };
        const icon = icons[route.name];
        const name = (focused ? icon?.active : icon?.inactive) ?? 'ellipse';
        return <Ionicons name={name as any} size={focused ? size + 1 : size} color={color} />;
      },
    })}
  >
    <MainTab.Screen
      name="Flow"
      component={FlowScreen}
      options={{ tabBarLabel: 'Flow' }}
    />
    <MainTab.Screen
      name="Commitments"
      component={ExpensesScreen}
      options={{ tabBarLabel: 'Commitments' }}
    />
    <MainTab.Screen
      name="Overview"
      component={DashboardScreen}
      options={{ tabBarLabel: 'Overview' }}
    />
    <MainTab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ tabBarLabel: 'Settings' }}
    />
  </MainTab.Navigator>
);

// ─────────────────────────────────────────────
// Root Navigator — decides Auth vs Main
// ─────────────────────────────────────────────

const LoadingScreen = () => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const SetupScreen = () => (
  <View style={styles.setup}>
    <Ionicons name="warning-outline" size={48} color={colors.warning} />
    <Text style={styles.setupTitle}>Supabase Not Configured</Text>
    <Text style={styles.setupText}>
      Create a <Text style={styles.setupCode}>.env</Text> file in the project root with your Supabase credentials:
    </Text>
    <View style={styles.setupBox}>
      <Text style={styles.setupCode}>EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co{'\n'}EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key</Text>
    </View>
    <Text style={styles.setupText}>Then restart the dev server with <Text style={styles.setupCode}>npx expo start</Text></Text>
    <Text style={styles.setupSub}>See SETUP.md for full instructions.</Text>
  </View>
);

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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  setup: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  setupTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  setupText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  setupBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
  },
  setupCode: {
    fontFamily: 'monospace',
    fontSize: typography.sm,
    color: colors.primary,
  },
  setupSub: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    textAlign: 'center',
  },
});

// Extend RootStackParamList to include modal
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {
      AddExpense: { expense?: import('../types').Expense } | undefined;
    }
  }
}
