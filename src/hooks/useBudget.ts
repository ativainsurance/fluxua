import { useState, useEffect, useCallback } from 'react';
import {
  fetchFinancialProfile,
  upsertFinancialProfile,
  fetchAutoCCDebt,
} from '../services/supabase';
import { FinancialProfile, BudgetSnapshot } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentMonthYear } from '../utils/dateUtils';

// ─────────────────────────────────────────────
// Pure computation — no hooks, fully testable
// ─────────────────────────────────────────────

export const computeSnapshot = (
  profile: FinancialProfile | null,
  autoCCDebt: number
): BudgetSnapshot => {
  const income = profile?.annual_after_tax_income ?? 0;
  const assets = profile?.total_assets ?? 0;
  const loans = profile?.total_other_loans_balance ?? 0;
  const effectiveCCDebt =
    profile?.cc_debt_override !== null && profile?.cc_debt_override !== undefined
      ? profile.cc_debt_override
      : autoCCDebt;

  const monthly = income / 12;
  const needs = 0.5 * monthly;
  const wants = 0.3 * monthly;
  const savings = 0.2 * monthly;
  const emergencyTarget = 3 * monthly;
  const retirementMonthly = 0.15 * monthly;
  const liabilities = effectiveCCDebt + loans;
  const netWorth = assets - liabilities;

  return {
    monthly,
    needs,
    wants,
    savings,
    emergencyTarget,
    monthsToFundEmergency: savings > 0 ? emergencyTarget / savings : null,
    monthsToPayoffCC: savings > 0 && effectiveCCDebt > 0 ? effectiveCCDebt / savings : null,
    yearsToPayoffLoans: savings > 0 && loans > 0 ? loans / savings / 12 : null,
    retirementMonthly,
    effectiveCCDebt,
    liabilities,
    netWorth,
  };
};

// ─────────────────────────────────────────────
// useBudget hook
// ─────────────────────────────────────────────

export const useBudget = () => {
  const { user } = useAuth();
  const { month, year } = getCurrentMonthYear();

  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [autoCCDebt, setAutoCCDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [profileData, ccDebt] = await Promise.all([
        fetchFinancialProfile(user.id),
        fetchAutoCCDebt(user.id, month, year),
      ]);
      setProfile(profileData);
      setAutoCCDebt(ccDebt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, [user, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = useCallback(
    async (
      updates: Partial<Omit<FinancialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
    ) => {
      if (!user) return;
      setSaving(true);
      setError(null);
      try {
        const updated = await upsertFinancialProfile(user.id, updates);
        setProfile(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save profile');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  const snapshot = computeSnapshot(profile, autoCCDebt);

  return { profile, snapshot, autoCCDebt, loading, saving, error, saveProfile, reload: load };
};
