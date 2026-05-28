import { Expense } from '../types';

// ─────────────────────────────────────────────
// Navigation Param Lists
// ─────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Transfer: undefined;
  Commitments: undefined;
  Overview: undefined;
  Budget: undefined;
  Settings: undefined;
};

export type ExpensesStackParamList = {
  ExpenseList: undefined;
  AddExpense: { expense?: Expense } | undefined;
  ExpenseDetail: { expense: Expense };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AddExpense: { expense?: import('../types').Expense } | undefined;
  HouseholdOnboarding: undefined;
};

// ─────────────────────────────────────────────
// Settings sub-screen stack
// ─────────────────────────────────────────────

export type SettingsStackParamList = {
  SettingsHome: undefined;
  PersonalDetails: undefined;
  Email: undefined;
  Security: undefined;
  Notifications: undefined;
  Currency: undefined;
  Language: undefined;
  HelpFaq: undefined;
  PrivacyPolicy: undefined;
  Household: undefined;
  RecurringIncome: undefined;
};
