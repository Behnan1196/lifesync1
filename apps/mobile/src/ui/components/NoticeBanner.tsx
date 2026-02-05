import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

type Props = {
  message: string;
};

export function NoticeBanner({ message }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: 8,
  },
  text: {
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
});
