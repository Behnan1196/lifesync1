import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useI18n } from '../i18n/useI18n';
import { Language } from '../i18n/i18n';
import { setLanguage as persistLanguage } from '../storage/kv';
import { ListRow } from '../ui/components/ListRow';
import { theme } from '../theme/theme';

export function SettingsSection() {
  const { t, language, setLanguage } = useI18n();

  async function handleLanguageChange() {
    const newLang: Language = language === 'tr' ? 'en' : 'tr';
    setLanguage(newLang);
    await persistLanguage(newLang);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('profile_settings')}</Text>
      <ListRow
        label={t('language_selector')}
        value={language === 'tr' ? t('language_tr') : t('language_en')}
        onPress={handleLanguageChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
});
