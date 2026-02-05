import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { supabase } from '../core/supabase';
import { useI18n } from '../i18n/useI18n';
import { getLastEmail, setLastEmail } from '../storage/kv';
import { Language } from '../i18n/i18n';
import { Screen } from '../ui/components/Screen';
import { TextField } from '../ui/components/TextField';
import { Button } from '../ui/components/Button';
import { ListRow } from '../ui/components/ListRow';
import { theme } from '../theme/theme';

export function LoginScreen() {
  const { t, language, setLanguage } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLastEmail().then(setEmail);
  }, []);

  async function handleLogin() {
    if (!email || !password) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert(t('login_error'));
    } else {
      await setLastEmail(email);
    }
  }

  function toggleLanguage() {
    const newLang: Language = language === 'tr' ? 'en' : 'tr';
    setLanguage(newLang);
  }

  return (
    <Screen title={t('login_title')}>
      <View style={styles.container}>
        <View style={styles.form}>
          <TextField
            label={t('login_email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            label={t('login_password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button
            title={t('login_button')}
            onPress={handleLogin}
            disabled={loading || !email || !password}
          />
        </View>

        <View style={styles.languageSection}>
          <ListRow
            label={t('language_selector')}
            value={language === 'tr' ? t('language_tr') : t('language_en')}
            onPress={toggleLanguage}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.md,
  },
  languageSection: {
    marginTop: theme.spacing.xl,
  },
});
