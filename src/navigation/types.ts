import { Expense } from '../types';

// ─────────────────────────────────────────────
// Navigation Param Lists
// ─────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Flow: undefined;
  Commitments: undefined;
  Overview: undefined;
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
};
