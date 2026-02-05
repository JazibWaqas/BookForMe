import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../constants/colors';

interface ChatInputProps {
    onSend: (content: string, mediaUrl?: string, mediaType?: 'text' | 'image' | 'audio') => void;
    onTyping?: (isTyping: boolean) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function ChatInput({ onSend, onTyping, placeholder, disabled }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);

    const handleTextChange = (text: string) => {
        setMessage(text);
        onTyping?.(text.length > 0);
    };

    const handleSend = () => {
        if (message.trim() || disabled) {
            onSend(message.trim(), undefined, 'text');
            setMessage('');
            onTyping?.(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
            });

            if (!result.canceled && result.assets[0]) {
                // In a real app, upload the image first, then send
                onSend('', result.assets[0].uri, 'image');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleVoicePress = () => {
        if (isRecording) {
            // Stop recording
            setIsRecording(false);
            // In a real app, process and send the audio
            Alert.alert('Voice Message', 'Voice messages coming soon!');
        } else {
            // Start recording
            setIsRecording(true);
        }
    };

    return (
        <View style={styles.container}>
            {/* Attachment Button */}
            <TouchableOpacity style={styles.iconButton} onPress={handlePickImage}>
                <Ionicons name="attach" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Input Container */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder || "Type a message..."}
                    placeholderTextColor={COLORS.textMuted}
                    value={message}
                    onChangeText={handleTextChange}
                    multiline
                    maxLength={1000}
                    editable={!disabled}
                />

                {/* Emoji Button */}
                <TouchableOpacity style={styles.emojiButton}>
                    <Ionicons name="happy-outline" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Send or Voice Button */}
            {message.trim().length > 0 ? (
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                    onPress={handleVoicePress}
                >
                    <Ionicons
                        name={isRecording ? "stop" : "mic"}
                        size={22}
                        color={isRecording ? "#fff" : COLORS.textMuted}
                    />
                </TouchableOpacity>
            )}
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
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: COLORS.card,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        minHeight: 40,
        maxHeight: 120,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        paddingTop: 0,
        paddingBottom: 0,
    },
    emojiButton: {
        marginLeft: 8,
        marginBottom: 2,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButtonActive: {
        backgroundColor: '#EF4444',
    },
});
