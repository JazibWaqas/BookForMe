import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface ChatInputProps {
    onSend: (content: string) => void;
    onTyping?: (isTyping: boolean) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function ChatInput({ onSend, onTyping, placeholder, disabled }: ChatInputProps) {
    const [message, setMessage] = useState('');

    const handleChange = (text: string) => {
        setMessage(text);
        onTyping?.(text.length > 0);
    };

    const handleSend = () => {
        const trimmed = message.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setMessage('');
        onTyping?.(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputWrap}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder || 'Type a message...'}
                    placeholderTextColor={COLORS.textMuted}
                    value={message}
                    onChangeText={handleChange}
                    multiline
                    maxLength={1000}
                    editable={!disabled}
                />
            </View>
            <TouchableOpacity
                style={[styles.sendButton, (!message.trim() || disabled) && styles.sendDisabled]}
                onPress={handleSend}
                disabled={!message.trim() || disabled}
            >
                <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    inputWrap: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        minHeight: 40,
        maxHeight: 120,
    },
    input: {
        fontSize: 16,
        color: COLORS.text,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendDisabled: {
        opacity: 0.4,
    },
});
