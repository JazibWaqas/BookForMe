import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/colors';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  style?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
  /** Error message — when set, the input renders in error state and shows the message below. */
  error?: string;
  /** Helper text shown below the input when no error is present. */
  helperText?: string;
  /** Mark the field visually as required (appends *). */
  required?: boolean;
  editable?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function Input({
  value,
  onChangeText,
  label,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  style,
  inputStyle,
  multiline = false,
  numberOfLines,
  error,
  helperText,
  required = false,
  editable = true,
  autoCapitalize,
  autoCorrect,
  onBlur,
  onFocus,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  const wrapperBorderColor = hasError
    ? COLORS.error
    : focused
    ? COLORS.borderFocus
    : COLORS.border;

  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
  };

  return (
    <View style={style}>
      {label && (
        <Text style={styles.label} accessibilityRole="text">
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        onFocus={handleFocus}
        onBlur={handleBlur}
        testID={testID}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !editable }}
        style={[
          styles.input,
          { borderColor: wrapperBorderColor },
          multiline && styles.inputMultiline,
          !editable && styles.inputDisabled,
          inputStyle,
        ]}
      />
      {hasError ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    height: 56,
  },
  inputMultiline: {
    height: 'auto',
    minHeight: 56,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.error,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
