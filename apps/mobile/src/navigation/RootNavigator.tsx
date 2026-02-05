import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../core/supabase';
import { SessionContext } from '../auth/session';
import { LoginScreen } from '../auth/LoginScreen';
import { SetupIncompleteScreen } from '../auth/SetupIncompleteScreen';
import { BottomTabs } from './BottomTabs';

export function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) checkSetup();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkSetup();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkSetup() {
    try {
      const { error } = await supabase.from('profiles').select('user_id').limit(1);
      setSetupComplete(!error);
    } catch {
      setSetupComplete(false);
    }
  }

  const sessionValue = { session, loading };

  return (
    <SessionContext.Provider value={sessionValue}>
      <NavigationContainer>
        {loading ? null : !session ? (
          <LoginScreen />
        ) : !setupComplete ? (
          <SetupIncompleteScreen />
        ) : (
          <BottomTabs />
        )}
      </NavigationContainer>
    </SessionContext.Provider>
  );
}
