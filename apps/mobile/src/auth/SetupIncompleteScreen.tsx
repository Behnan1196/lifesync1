import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useI18n } from '../i18n/useI18n';
import { Screen } from '../ui/components/Screen';
import { theme } from '../theme/theme';

export function SetupIncompleteScreen() {
  const { t } = useI18n();

  return (
    <Screen title={t('setup_incomplete_title')}>
      <View style={styles.container}>
        <Text style={styles.message}>{t('setup_incomplete_message')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
