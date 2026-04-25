import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../../constants/colors';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export default function Badge({ text, variant = 'default', style, accessibilityLabel }: BadgeProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'success' && styles.success,
        variant === 'warning' && styles.warning,
        variant === 'error' && styles.errorContainer,
        style,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? `${variant} badge: ${text}`}
    >
      <Text
        style={[
          styles.text,
          variant === 'success' && styles.successText,
          variant === 'warning' && styles.warningText,
          variant === 'error' && styles.errorText,
        ]}
      >
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
    borderRadius: RADIUS.sm,
    borderColor: COLORS.borderStrong,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  success: {
    borderColor: 'rgba(0, 208, 132, 0.4)',
    backgroundColor: 'rgba(0, 208, 132, 0.08)',
  },
  warning: {
    borderColor: 'rgba(255, 159, 10, 0.4)',
    backgroundColor: 'rgba(255, 159, 10, 0.08)',
  },
  errorContainer: {
    borderColor: 'rgba(255, 69, 58, 0.4)',
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
  },
  text: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  successText: {
    color: COLORS.success,
  },
  warningText: {
    color: COLORS.warning,
  },
  errorText: {
    color: COLORS.error,
  },
});
