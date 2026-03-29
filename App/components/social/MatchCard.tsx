import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import Avatar from '../ui/Avatar';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

interface Match {
    id: string;
    sport_type: string;
    match_type: string;
    date: string;
    time: string;
    location: string;
    max_players: number;
    participants?: Array<{ id: string; name: string; avatar_url?: string }>;
    host_user_id?: string;
    description?: string;
}

interface MatchCardProps {
    match: Match;
    onSwipeRight: () => void;
    onSwipeLeft: () => void;
    isFirst: boolean;
}

export default function MatchCard({ match, onSwipeRight, onSwipeLeft, isFirst }: MatchCardProps) {
    const position = useRef(new Animated.ValueXY()).current;
    const [likeOpacity] = useState(new Animated.Value(0));
    const [nopeOpacity] = useState(new Animated.Value(0));

    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ['-10deg', '0deg', '10deg'],
        extrapolate: 'clamp',
    });

    const rotateAndTranslate = {
        transform: [
            { rotate },
            ...position.getTranslateTransform(),
        ],
    };

    const likeScale = position.x.interpolate({
        inputRange: [0, SCREEN_WIDTH / 4],
        outputRange: [0.5, 1],
        extrapolate: 'clamp',
    });

    const nopeScale = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 4, 0],
        outputRange: [1, 0.5],
        extrapolate: 'clamp',
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isFirst,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
                // Update overlay opacity
                if (gesture.dx > 0) {
                    likeOpacity.setValue(Math.min(gesture.dx / (SCREEN_WIDTH / 4), 1));
                    nopeOpacity.setValue(0);
                } else {
                    nopeOpacity.setValue(Math.min(-gesture.dx / (SCREEN_WIDTH / 4), 1));
                    likeOpacity.setValue(0);
                }
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    // Swiped right - Join match
                    Animated.timing(position, {
                        toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
                        duration: SWIPE_OUT_DURATION,
                        useNativeDriver: false,
                    }).start(() => onSwipeRight());
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    // Swiped left - Skip
                    Animated.timing(position, {
                        toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
                        duration: SWIPE_OUT_DURATION,
                        useNativeDriver: false,
                    }).start(() => onSwipeLeft());
                } else {
                    // Return to center
                    Animated.spring(position, {
                        toValue: { x: 0, y: 0 },
                        friction: 4,
                        useNativeDriver: false,
                    }).start();
                    likeOpacity.setValue(0);
                    nopeOpacity.setValue(0);
                }
            },
        })
    ).current;

    const getSportIcon = (sport: string) => {
        const icons: Record<string, string> = {
            'Padel': '🎾',
            'Tennis': '🎾',
            'Football': '⚽',
            'Futsal': '⚽',
            'Basketball': '🏀',
            'Volleyball': '🏐',
            'Badminton': '🏸',
            'Cricket': '🏏',
            'Squash': '🎾',
            'TableTennis': '🏓',
            'Hockey': '🏒',
        };
        return icons[sport] || '⚽';
    };

    const currentPlayers = match.participants?.length || 1;

    return (
        <Animated.View
            {...(isFirst ? panResponder.panHandlers : {})}
            style={[styles.card, isFirst ? rotateAndTranslate : { transform: [{ scale: 0.95 }] }]}
        >
            <LinearGradient
                colors={['#1E293B', '#0F172A']}
                style={styles.cardGradient}
            >
                {/* Join Indicator */}
                <Animated.View style={[styles.joinOverlay, { opacity: likeOpacity, transform: [{ scale: likeScale }] }]}>
                    <View style={styles.joinBadge}>
                        <Text style={styles.joinText}>JOIN</Text>
                        <Ionicons name="checkmark-circle" size={32} color="#4ADE80" />
                    </View>
                </Animated.View>

                {/* Skip Indicator */}
                <Animated.View style={[styles.skipOverlay, { opacity: nopeOpacity, transform: [{ scale: nopeScale }] }]}>
                    <View style={styles.skipBadge}>
                        <Text style={styles.skipText}>SKIP</Text>
                        <Ionicons name="close-circle" size={32} color="#EF4444" />
                    </View>
                </Animated.View>

                {/* Sport Icon */}
                <View style={styles.sportIconContainer}>
                    <Text style={styles.sportIcon}>{getSportIcon(match.sport_type)}</Text>
                </View>

                {/* Sport Name */}
                <Text style={styles.sportName}>{match.sport_type}</Text>

                {/* Match Type Badge */}
                <View style={[styles.typeBadge, match.match_type === 'ranked' && styles.typeBadgeRanked]}>
                    <Text style={styles.typeText}>
                        {match.match_type === 'ranked' ? '🏆 RANKED' : '⚡ CASUAL'}
                    </Text>
                </View>

                {/* Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.detailText}>{match.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.detailText}>{match.time}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={18} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.detailText} numberOfLines={1}>{match.location || 'TBD'}</Text>
                    </View>
                </View>

                {/* Players */}
                <View style={styles.playersSection}>
                    <Text style={styles.playersLabel}>PLAYERS</Text>
                    <View style={styles.playersRow}>
                        {match.participants?.slice(0, 4).map((p, i) => (
                            <View key={p.id} style={[styles.playerAvatarWrap, { marginLeft: i > 0 ? -10 : 0 }]}>
                                <Avatar uri={p.avatar_url} name={p.name || '?'} size={32} style={styles.playerAvatar} />
                            </View>
                        ))}
                        <View style={styles.playerCountBadge}>
                            <Text style={styles.playerCountText}>
                                {currentPlayers}/{match.max_players}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Description */}
                {match.description && (
                    <Text style={styles.description} numberOfLines={2}>
                        "{match.description}"
                    </Text>
                )}

                {/* Swipe Hint */}
                <View style={styles.swipeHint}>
                    <Text style={styles.swipeHintText}>← Swipe left to Skip  •  Swipe right to Join →</Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        width: SCREEN_WIDTH - 40,
        height: 520,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardGradient: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    joinOverlay: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1000,
    },
    joinBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#4ADE80',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
    },
    joinText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4ADE80',
        marginRight: 8,
    },
    skipOverlay: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1000,
    },
    skipBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#EF4444',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    skipText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#EF4444',
        marginRight: 8,
    },
    sportIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 6,
    },
    sportIcon: {
        fontSize: 32,
    },
    sportName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    typeBadge: {
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 208, 132, 0.15)',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 208, 132, 0.3)',
    },
    typeBadgeRanked: {
        backgroundColor: 'rgba(255, 159, 10, 0.15)',
        borderColor: 'rgba(255, 159, 10, 0.3)',
    },
    typeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#00D084',
        letterSpacing: 0.5,
    },
    detailsContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
        fontWeight: '600',
    },
    playersSection: {
        alignItems: 'center',
        marginBottom: 8,
    },
    playersLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 6,
        letterSpacing: 1.5,
    },
    playersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerAvatarWrap: {
        borderWidth: 2,
        borderColor: '#1E293B',
        borderRadius: 18,
    },
    playerAvatar: {
        borderWidth: 0,
    },
    playerCountBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    playerCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    description: {
        fontStyle: 'italic',
        color: COLORS.textMuted,
        textAlign: 'center',
        fontSize: 13,
    },
    swipeHint: {
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 8,
    },
    swipeHintText: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
});
