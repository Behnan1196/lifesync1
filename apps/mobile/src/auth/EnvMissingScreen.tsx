import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useI18n } from '../i18n/useI18n';
import { Screen } from '../ui/components/Screen';
import { theme } from '../theme/theme';

type Props = {
  missing: string[];
};

export function EnvMissingScreen({ missing }: Props) {
  const { t } = useI18n();

  return (
    <Screen title={t('env_missing_title')}>
      <View style={styles.container}>
        <Text style={styles.message}>{t('env_missing_message')}</Text>
        {missing.map((key) => (
          <Text key={key} style={styles.key}>• {key}</Text>
        ))}
        <Text style={styles.instructions}>{t('env_missing_instructions')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  key: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  instructions: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
  },
});
