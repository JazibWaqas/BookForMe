import React from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/colors';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export default function Input({
  value,
  onChangeText,
  label,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  style,
  multiline = false,
  numberOfLines
}: InputProps) {
  return (
    <View style={style}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  inputMultiline: {
    height: 'auto',
    minHeight: 56,
    paddingTop: 16,
    paddingBottom: 16,
  },
});
