import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { theme } from '../../theme/theme';

type Props = {
  title: string;
  children: React.ReactNode;
};

export function Screen({ children }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
});
