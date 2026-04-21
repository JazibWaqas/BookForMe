import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import Avatar from '../ui/Avatar';

interface LeaderUser {
    id: string;
    name: string;
    avatar_url?: string;
    points: number;
    rank?: number;
    level?: number;
}

interface LeaderboardRowProps {
    user: LeaderUser;
    rank: number;
    isCurrentUser?: boolean;
    onPress?: () => void;
}

export default function LeaderboardRow({ user, rank, isCurrentUser, onPress }: LeaderboardRowProps) {
    // Calculate level and progress
    const getLevel = (points: number) => {
        if (points < 100) return { level: 1, progress: points / 100 };
        if (points < 250) return { level: 2, progress: (points - 100) / 150 };
        if (points < 500) return { level: 3, progress: (points - 250) / 250 };
        if (points < 1000) return { level: 4, progress: (points - 500) / 500 };
        if (points < 2000) return { level: 5, progress: (points - 1000) / 1000 };
        return { level: 6 + Math.floor((points - 2000) / 1000), progress: ((points - 2000) % 1000) / 1000 };
    };

    const { level, progress } = getLevel(user.points);

    const getRankStyle = () => {
        if (rank <= 3) return { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary };
        if (rank <= 10) return { backgroundColor: COLORS.secondary + '20', borderColor: COLORS.secondary };
        return { backgroundColor: COLORS.card, borderColor: COLORS.border };
    };

    const getRankIcon = () => {
        if (rank === 1) return { name: 'trophy', color: '#FFB800', type: 'material' };
        if (rank === 2) return { name: 'medal', color: '#A0B2C6', type: 'material' };
        if (rank === 3) return { name: 'medal', color: '#CD7F32', type: 'material' };
        if (rank <= 10) return { name: 'flame', color: COLORS.warning, type: 'ion' };
        return null;
    };

    const iconData = getRankIcon();

    return (
        <TouchableOpacity
            style={[styles.container, getRankStyle(), isCurrentUser && styles.currentUser]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Rank */}
            <View style={styles.rankContainer}>
                <Text style={[styles.rankText, rank <= 3 && styles.topRankText]}>#{rank}</Text>
                {iconData && (
                    iconData.type === 'material' ? (
                        <MaterialCommunityIcons name={iconData.name as any} size={14} color={iconData.color} style={styles.badgeIcon} />
                    ) : (
                        <Ionicons name={iconData.name as any} size={14} color={iconData.color} style={styles.badgeIcon} />
                    )
                )}
            </View>

            {/* Avatar */}
            <View style={styles.avatarContainer}>
                <Avatar
                    uri={user.avatar_url}
                    name={user.name}
                    size={44}
                    style={styles.avatar}
                />
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{level}</Text>
                </View>
            </View>

            {/* User Info */}
            <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {user.name}
                        {isCurrentUser && <Text style={styles.youTag}> (You)</Text>}
                    </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>Lvl {level}</Text>
                </View>
            </View>

            {/* Points */}
            <View style={styles.pointsContainer}>
                <Text style={styles.pointsValue}>{user.points.toLocaleString()}</Text>
                <Text style={styles.pointsLabel}>pts</Text>
            </View>

            {/* Arrow */}
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    currentUser: {
        borderColor: COLORS.primary,
        borderWidth: 2,
        backgroundColor: COLORS.primary + '15',
    },
    rankContainer: {
        width: 45,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textMuted,
    },
    topRankText: {
        color: COLORS.primary,
    },
    badgeIcon: {
        fontSize: 14,
        marginTop: 2,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
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
        borderColor: COLORS.background,
    },
    levelText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
        marginRight: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    youTag: {
        color: COLORS.primary,
        fontWeight: 'normal',
        fontSize: 12,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        marginRight: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        color: COLORS.textMuted,
        width: 40,
    },
    pointsContainer: {
        alignItems: 'flex-end',
        marginRight: 8,
    },
    pointsValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    pointsLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
    },
});
