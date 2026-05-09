import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../constants/colors';
import Avatar from '../ui/Avatar';

interface LeaderUser {
    id: string;
    name: string;
    avatar_url?: string;
    points: number;
    rank?: number;
}

interface LeaderboardPodiumProps {
    topThree: LeaderUser[];
}

export default function LeaderboardPodium({ topThree }: LeaderboardPodiumProps) {
    if (topThree.length < 3) return null;

    const [first, second, third] = topThree;

    const renderPodiumSpot = (user: LeaderUser, position: 1 | 2 | 3) => {
        const configs = {
            1: { height: 110, color: '#FFB800', icon: 'trophy', size: 76 },
            2: { height: 85, color: '#A0B2C6', icon: 'medal', size: 60 },
            3: { height: 65, color: '#CD7F32', icon: 'medal', size: 60 },
        } as const;
        const config = configs[position];

        return (
            <View style={[styles.podiumSpot, position === 1 && styles.firstPlace]}>
                <View style={styles.avatarWrap}>
                    <Avatar
                        uri={user.avatar_url}
                        name={user.name}
                        size={config.size}
                        style={[styles.avatar, { borderColor: config.color, borderWidth: position === 1 ? 3 : 2 }]}
                    />
                    <View style={[styles.badge, { backgroundColor: config.color }]}>
                        <MaterialCommunityIcons name={config.icon as any} size={position === 1 ? 16 : 14} color="#FFF" />
                    </View>
                </View>

                <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                
                <View style={styles.pointsPill}>
                    <Text style={styles.pointsText}>{user.points.toLocaleString()}</Text>
                </View>

                <View style={[
                    styles.podiumBlock, 
                    { height: config.height, borderTopColor: config.color }
                ]}>
                    <Text style={[styles.podiumRank, { color: config.color }]}>{position}</Text>
                    <Text style={styles.podiumSuffix}>
                        {position === 1 ? 'st' : position === 2 ? 'nd' : 'rd'}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.podiumContainer}>
                {renderPodiumSpot(second, 2)}
                {renderPodiumSpot(first, 1)}
                {renderPodiumSpot(third, 3)}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 16,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginHorizontal: 8,
    },
    podiumSpot: {
        alignItems: 'center',
        flex: 1,
        maxWidth: 110,
        marginHorizontal: 4,
    },
    firstPlace: {
        zIndex: 2,
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: 10,
    },
    avatar: {
        borderRadius: 40,
        backgroundColor: COLORS.surface,
    },
    badge: {
        position: 'absolute',
        bottom: -4,
        alignSelf: 'center',
        padding: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.background,
        ...SHADOWS.primaryGlow,
    },
    userName: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 4,
        maxWidth: 90,
        textAlign: 'center',
    },
    pointsPill: {
        backgroundColor: COLORS.surfaceRaised,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.pill,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    pointsText: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '700',
    },
    podiumBlock: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.md,
        borderTopRightRadius: RADIUS.md,
        borderTopWidth: 3,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 0,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    podiumRank: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -1,
    },
    podiumSuffix: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginTop: -10,
        marginLeft: 2,
    },
});
