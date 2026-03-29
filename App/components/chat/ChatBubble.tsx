import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    status?: 'sent' | 'delivered' | 'read';
}

interface ChatBubbleProps {
    message: Message;
    isOwn: boolean;
}

export default function ChatBubble({ message, isOwn }: ChatBubbleProps) {
    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const statusIcon = () => {
        if (!isOwn) return null;
        switch (message.status) {
            case 'read':
                return <Ionicons name="checkmark-done" size={14} color="#3B82F6" />;
            case 'delivered':
                return <Ionicons name="checkmark-done" size={14} color={COLORS.textMuted} />;
            default:
                return <Ionicons name="checkmark" size={14} color={COLORS.textMuted} />;
        }
    };

    return (
        <View style={[styles.container, isOwn ? styles.own : styles.other]}>
            <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                <Text style={[styles.text, isOwn && styles.ownText]}>{message.content}</Text>
                <View style={styles.meta}>
                    <Text style={[styles.time, isOwn && styles.ownTime]}>{formatTime(message.created_at)}</Text>
                    {statusIcon()}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginVertical: 4, paddingHorizontal: 12 },
    own: { alignItems: 'flex-end' },
    other: { alignItems: 'flex-start' },
    bubble: { maxWidth: '75%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
    ownBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
    otherBubble: { backgroundColor: COLORS.card, borderBottomLeftRadius: 4 },
    text: { fontSize: 15, color: COLORS.text, lineHeight: 20 },
    ownText: { color: '#fff' },
    meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 },
    time: { fontSize: 11, color: COLORS.textMuted },
    ownTime: { color: 'rgba(255,255,255,0.7)' },
});
