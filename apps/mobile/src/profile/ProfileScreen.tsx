import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useI18n } from '../i18n/useI18n';
import { useSession } from '../auth/session';
import { supabase } from '../core/supabase';
import { Screen } from '../ui/components/Screen';
import { ListRow } from '../ui/components/ListRow';
import { Button } from '../ui/components/Button';
import { SettingsSection } from './SettingsSection';
import { theme } from '../theme/theme';

type Profile = {
  role: string;
} | null;

export function ProfileScreen() {
  const { t } = useI18n();
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [session]);

  async function loadProfile() {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoaded(true);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const email = session?.user.email || '';
  const role = profile?.role || 'user';
  const roleLabel = role === 'admin' ? t('role_admin') : t('role_user');
  const showFallbackNote = profileLoaded && !profile;

  return (
    <Screen title={t('profile_title')}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <ListRow label={t('profile_email')} value={email} />
          <ListRow
            label={t('profile_role')}
            value={roleLabel}
            note={showFallbackNote ? t('profile_role_fallback_note') : undefined}
          />
        </View>

        <SettingsSection />

        <View style={styles.logoutSection}>
          <Button title={t('profile_logout')} onPress={handleLogout} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  logoutSection: {
    padding: theme.spacing.lg,
  },
});
