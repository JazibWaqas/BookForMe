import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import Avatar from '../ui/Avatar';

interface User {
    id: string;
    name: string;
    avatar_url?: string;
    level?: number;
    mutual_friends?: number;
}

type FriendStatus = 'none' | 'pending' | 'friends' | 'incoming';

interface FriendCardProps {
    user: User;
    status: FriendStatus;
    onAddFriend?: () => void;
    onAccept?: () => void;
    onReject?: () => void;
    onMessage?: () => void;
    onRemove?: () => void;
    onViewProfile?: () => void;
}

export default function FriendCard({
    user,
    status,
    onAddFriend,
    onAccept,
    onReject,
    onMessage,
    onRemove,
    onViewProfile,
}: FriendCardProps) {
    const renderActionButtons = () => {
        switch (status) {
            case 'none':
                return (
                    <TouchableOpacity style={styles.addButton} onPress={onAddFriend}>
                        <Ionicons name="person-add" size={18} color="#fff" />
                        <Text style={styles.addButtonText}>Add Friend</Text>
                    </TouchableOpacity>
                );

            case 'pending':
                return (
                    <View style={styles.pendingButton}>
                        <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
                        <Text style={styles.pendingText}>Pending</Text>
                    </View>
                );

            case 'incoming':
                return (
                    <View style={styles.incomingActions}>
                        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
                            <Ionicons name="checkmark" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
                            <Ionicons name="close" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                );

            case 'friends':
                return (
                    <View style={styles.friendActions}>
                        <TouchableOpacity style={styles.messageButton} onPress={onMessage}>
                            <Ionicons name="chatbubble" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.moreButton} onPress={onRemove}>
                            <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                );
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onViewProfile} activeOpacity={0.8}>
            {/* Avatar with Level Badge */}
            <View style={styles.avatarContainer}>
                <Avatar
                    uri={user.avatar_url}
                    name={user.name}
                    size={56}
                    style={styles.avatar}
                />
                {user.level && (
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>{user.level}</Text>
                    </View>
                )}
            </View>

            {/* User Info */}
            <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
                {user.mutual_friends && user.mutual_friends > 0 && (
                    <Text style={styles.mutualFriends}>
                        <Ionicons name="people-outline" size={12} color={COLORS.textMuted} />
                        {' '}{user.mutual_friends} mutual friends
                    </Text>
                )}
                {status === 'friends' && (
                    <View style={styles.friendBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={COLORS.primary} />
                        <Text style={styles.friendBadgeText}>Friends</Text>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            {renderActionButtons()}
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
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    levelBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: COLORS.secondary,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.card,
    },
    levelText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    mutualFriends: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    friendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    friendBadgeText: {
        fontSize: 11,
        color: COLORS.primary,
        marginLeft: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 13,
    },
    pendingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    pendingText: {
        color: COLORS.textMuted,
        marginLeft: 6,
        fontSize: 13,
    },
    incomingActions: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    friendActions: {
        flexDirection: 'row',
        gap: 8,
    },
    messageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
