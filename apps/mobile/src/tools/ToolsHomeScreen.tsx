import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useI18n } from '../i18n/useI18n';
import { useSession } from '../auth/session';
import { fetchEntitlements, EntitlementsResult } from './entitlements';
import { Screen } from '../ui/components/Screen';
import { NoticeBanner } from '../ui/components/NoticeBanner';
import { theme } from '../theme/theme';

export function ToolsHomeScreen() {
  const { t } = useI18n();
  const { session } = useSession();
  const isFocused = useIsFocused();
  const [tools, setTools] = useState<string[]>([]);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isFocused && session) {
      loadEntitlements();
    }
  }, [isFocused, session]);

  async function loadEntitlements() {
    if (!session) return;

    const result: EntitlementsResult = await fetchEntitlements(session.access_token);

    if (result.success) {
      setTools(result.data.tools);
      setBannerMessage(null);
    } else {
      setTools([]);
      if (result.reason === 'no_backend') {
        setBannerMessage(t('tools_entitlements_not_configured'));
      } else {
        setBannerMessage(t('tools_entitlements_load_failed'));
      }
    }
  }

  function handleToolPress(toolKey: string) {
    Alert.alert(toolKey, t('tools_placeholder_message'));
  }

  return (
    <Screen title={t('tools_title')}>
      {bannerMessage && <NoticeBanner message={bannerMessage} />}
      
      {tools.length === 0 && !bannerMessage ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('tools_empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={tools}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.toolRow}
              onPress={() => handleToolPress(item)}
            >
              <Text style={styles.toolText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  toolRow: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  toolText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
});
