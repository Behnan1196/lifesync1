import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

type Props = {
  label: string;
  value?: string;
  note?: string;
  onPress?: () => void;
};

export function ListRow({ label, value, note, onPress }: Props) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={styles.row} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
      {value && <Text style={styles.value}>{value}</Text>}
      {note && <Text style={styles.note}>{note}</Text>}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  label: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  value: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  note: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
