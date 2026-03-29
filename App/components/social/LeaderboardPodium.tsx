import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
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
        const config = {
            1: { height: 100, colors: ['#FFD700', '#FFA500'] as const, medal: '🥇', size: 80 },
            2: { height: 70, colors: ['#C0C0C0', '#A0A0A0'] as const, medal: '🥈', size: 65 },
            3: { height: 50, colors: ['#CD7F32', '#8B4513'] as const, medal: '🥉', size: 65 },
        }[position];

        return (
            <View style={[styles.podiumSpot, position === 1 && styles.firstPlace]}>
                {/* Avatar */}
                <View style={[styles.avatarContainer, { width: config.size, height: config.size }]}>
                    <Avatar
                        uri={user.avatar_url}
                        name={user.name}
                        size={config.size - 8}
                        style={styles.avatar}
                    />
                    <View style={styles.medalBadge}>
                        <Text style={styles.medalText}>{config.medal}</Text>
                    </View>
                </View>

                {/* Name */}
                <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>

                {/* Points */}
                <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>{user.points.toLocaleString()}</Text>
                </View>

                {/* Podium Block */}
                <LinearGradient
                    colors={config.colors}
                    style={[styles.podiumBlock, { height: config.height }]}
                >
                    <Text style={styles.podiumRank}>#{position}</Text>
                </LinearGradient>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.crownIcon}>👑</Text>
                <Text style={styles.title}>TOP PLAYERS</Text>
            </View>

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
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    crownIcon: {
        fontSize: 28,
        marginRight: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        letterSpacing: 2,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    podiumSpot: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    firstPlace: {
        marginBottom: 0,
    },
    avatarContainer: {
        borderRadius: 50,
        borderWidth: 3,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    avatar: {
        borderRadius: 50,
    },
    medalBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 2,
    },
    medalText: {
        fontSize: 20,
    },
    userName: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        maxWidth: 80,
        textAlign: 'center',
    },
    pointsBadge: {
        backgroundColor: COLORS.primary + '30',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    pointsText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    podiumBlock: {
        width: 70,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    podiumRank: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});
