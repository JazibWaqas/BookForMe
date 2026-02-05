import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import Avatar from '../ui/Avatar';

interface Participant {
    id: string;
    name: string;
    avatar_url?: string;
}

interface Conversation {
    id: string;
    participants: Participant[];
    last_message?: string;
    last_message_time?: string;
    unread_count?: number;
    is_online?: boolean;
}

interface ChatListItemProps {
    conversation: Conversation;
    currentUserId: string;
    onPress: () => void;
}

export default function ChatListItem({ conversation, currentUserId, onPress }: ChatListItemProps) {
    // Get the other participant (for 1:1 chats)
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId)
        || conversation.participants[0];

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return date.toLocaleDateString([], { weekday: 'short' });
            } else {
                return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
            }
        } catch {
            return '';
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            {/* Avatar with Online Indicator */}
            <View style={styles.avatarContainer}>
                <Avatar
                    uri={otherParticipant?.avatar_url}
                    name={otherParticipant?.name || 'Unknown'}
                    size={54}
                    style={styles.avatar}
                />
                {conversation.is_online && <View style={styles.onlineIndicator} />}
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {otherParticipant?.name || 'Unknown'}
                    </Text>
                    <Text style={[styles.time, (conversation.unread_count ?? 0) > 0 && styles.timeUnread]}>
                        {formatTime(conversation.last_message_time)}
                    </Text>
                </View>

                <View style={styles.messageRow}>
                    <Text style={[styles.lastMessage, (conversation.unread_count ?? 0) > 0 && styles.messageUnread]} numberOfLines={1}>
                        {conversation.last_message || 'Tap to start chatting'}
                    </Text>

                    {/* Unread Badge */}
                    {conversation.unread_count && conversation.unread_count > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>
                                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Chevron */}
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 14,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4ADE80',
        borderWidth: 2,
        borderColor: COLORS.card,
    },
    contentContainer: {
        flex: 1,
        marginRight: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    timeUnread: {
        color: COLORS.primary,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: COLORS.textMuted,
        flex: 1,
    },
    messageUnread: {
        color: COLORS.text,
        fontWeight: '500',
    },
    unreadBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 24,
        alignItems: 'center',
    },
    unreadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
