import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    media_url?: string;
    media_type?: 'image' | 'audio' | 'text';
    status?: 'sent' | 'delivered' | 'read';
}

interface ChatBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
    avatarUrl?: string;
    senderName?: string;
}

export default function ChatBubble({ message, isOwn, showAvatar, avatarUrl, senderName }: ChatBubbleProps) {
    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const getStatusIcon = () => {
        if (!isOwn) return null;
        switch (message.status) {
            case 'sent':
                return <Ionicons name="checkmark" size={14} color={COLORS.textMuted} />;
            case 'delivered':
                return <Ionicons name="checkmark-done" size={14} color={COLORS.textMuted} />;
            case 'read':
                return <Ionicons name="checkmark-done" size={14} color="#3B82F6" />;
            default:
                return <Ionicons name="checkmark" size={14} color={COLORS.textMuted} />;
        }
    };

    return (
        <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
            {/* Avatar (for other's messages) */}
            {!isOwn && showAvatar && (
                <Image
                    source={{ uri: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || 'U')}&background=random` }}
                    style={styles.avatar}
                />
            )}
            {!isOwn && !showAvatar && <View style={styles.avatarPlaceholder} />}

            <View style={styles.bubbleContainer}>
                {/* Sender name (for group chats) */}
                {!isOwn && senderName && showAvatar && (
                    <Text style={styles.senderName}>{senderName}</Text>
                )}

                {/* Bubble */}
                <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                    {/* Media Content */}
                    {message.media_url && message.media_type === 'image' && (
                        <Image
                            source={{ uri: message.media_url }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                        />
                    )}

                    {/* Audio Message */}
                    {message.media_url && message.media_type === 'audio' && (
                        <View style={styles.audioContainer}>
                            <Ionicons name="play-circle" size={32} color={isOwn ? '#fff' : COLORS.primary} />
                            <View style={styles.audioWaveform}>
                                {[...Array(12)].map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.audioBar,
                                            { height: Math.random() * 16 + 6 },
                                            isOwn ? styles.audioBarOwn : styles.audioBarOther
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[styles.audioDuration, isOwn && styles.textOwn]}>0:12</Text>
                        </View>
                    )}

                    {/* Text Content */}
                    {message.content && (
                        <Text style={[styles.messageText, isOwn && styles.ownText]}>
                            {message.content}
                        </Text>
                    )}

                    {/* Time & Status */}
                    <View style={styles.metaContainer}>
                        <Text style={[styles.timeText, isOwn && styles.ownTimeText]}>
                            {formatTime(message.created_at)}
                        </Text>
                        {getStatusIcon()}
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 4,
        paddingHorizontal: 12,
    },
    ownContainer: {
        justifyContent: 'flex-end',
    },
    otherContainer: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginTop: 4,
    },
    avatarPlaceholder: {
        width: 32,
        marginRight: 8,
    },
    bubbleContainer: {
        maxWidth: '75%',
    },
    senderName: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 4,
        marginLeft: 12,
    },
    bubble: {
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minWidth: 80,
    },
    ownBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: COLORS.card,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        color: COLORS.text,
        lineHeight: 20,
    },
    ownText: {
        color: '#fff',
    },
    mediaImage: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginBottom: 6,
    },
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    audioWaveform: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
        gap: 2,
    },
    audioBar: {
        width: 3,
        borderRadius: 2,
    },
    audioBarOwn: {
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    audioBarOther: {
        backgroundColor: COLORS.primary + '60',
    },
    audioDuration: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    textOwn: {
        color: 'rgba(255,255,255,0.8)',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
        gap: 4,
    },
    timeText: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    ownTimeText: {
        color: 'rgba(255,255,255,0.7)',
    },
});
