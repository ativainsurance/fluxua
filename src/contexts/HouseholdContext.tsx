import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  fetchUserHousehold,
  fetchHouseholdMembers,
  callCreateHousehold,
  callJoinHousehold,
} from '../services/supabase';
import { Household, HouseholdMember } from '../types';
import { useAuth } from './AuthContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface HouseholdContextType {
  household: Household | null;
  householdId: string | null;
  members: HouseholdMember[];
  loading: boolean;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (joinCode: string) => Promise<void>;
  reload: () => Promise<void>;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setHousehold(null);
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const h = await fetchUserHousehold(user.id);
      setHousehold(h);
      if (h) {
        const m = await fetchHouseholdMembers(h.id);
        setMembers(m);
      } else {
        setMembers([]);
      }
    } catch {
      setHousehold(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const createHousehold = useCallback(
    async (name: string) => {
      const h = await callCreateHousehold(name);
      setHousehold(h);
      if (user) {
        const m = await fetchHouseholdMembers(h.id);
        setMembers(m);
      }
    },
    [user]
  );

  const joinHousehold = useCallback(
    async (joinCode: string) => {
      const h = await callJoinHousehold(joinCode);
      setHousehold(h);
      if (user) {
        const m = await fetchHouseholdMembers(h.id);
        setMembers(m);
      }
    },
    [user]
  );

  return (
    <HouseholdContext.Provider
      value={{
        household,
        householdId: household?.id ?? null,
        members,
        loading,
        createHousehold,
        joinHousehold,
        reload: load,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = (): HouseholdContextType => {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
};
