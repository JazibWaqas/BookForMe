import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning';
  style?: ViewStyle;
}

export default function Badge({ text, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.base, variant === 'success' && styles.success, variant === 'warning' && styles.warning, style]}>
      <Text style={[styles.text, variant === 'success' && styles.successText, variant === 'warning' && styles.warningText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#6b7280',
  },
  success: {
    borderColor: '#4ade80',
  },
  warning: {
    borderColor: '#fbbf24',
  },
  text: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#e5e7eb',
  },
  successText: {
    color: '#4ade80',
  },
  warningText: {
    color: '#fbbf24',
  },
});
