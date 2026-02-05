import { createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';

type SessionContextType = {
  session: Session | null;
  loading: boolean;
};

export const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
