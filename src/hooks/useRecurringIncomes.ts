import { useState, useEffect, useCallback } from 'react';
import {
  fetchRecurringIncomes,
  createRecurringIncome,
  updateRecurringIncome,
  deleteRecurringIncome,
} from '../services/supabase';
import { RecurringIncome, RecurringIncomeFormData } from '../types';
import { useHousehold } from '../contexts/HouseholdContext';

export const useRecurringIncomes = () => {
  const { householdId } = useHousehold();
  const [incomes, setIncomes] = useState<RecurringIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecurringIncomes(householdId);
      setIncomes(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => { load(); }, [load]);

  const addIncome = async (formData: RecurringIncomeFormData): Promise<void> => {
    if (!householdId) return;
    const created = await createRecurringIncome(householdId, formData);
    setIncomes((prev) => [...prev, created].sort((a, b) => a.day_of_month - b.day_of_month));
  };

  const editIncome = async (id: string, updates: Partial<RecurringIncomeFormData>): Promise<void> => {
    const updated = await updateRecurringIncome(id, updates);
    setIncomes((prev) =>
      prev
        .map((inc) => (inc.id === id ? updated : inc))
        .sort((a, b) => a.day_of_month - b.day_of_month)
    );
  };

  const removeIncome = async (id: string): Promise<void> => {
    await deleteRecurringIncome(id);
    setIncomes((prev) => prev.filter((inc) => inc.id !== id));
  };

  return { incomes, loading, error, reload: load, addIncome, editIncome, removeIncome };
};
