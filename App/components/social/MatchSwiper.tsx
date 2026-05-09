import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MatchCard from './MatchCard';
import { COLORS } from '../../constants/colors';
import { showError } from '../../utils/feedback';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

interface MatchSwiperProps {
    matches: Match[];
    onJoinMatch: (matchId: string) => Promise<void>;
    onSkipMatch?: (matchId: string) => void;
    onRefresh: () => void;
}

export default function MatchSwiper({ matches, onJoinMatch, onSkipMatch, onRefresh }: MatchSwiperProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [skippedMatches, setSkippedMatches] = useState<string[]>([]);

    // Reset index when matches change (fix freezing issue)
    useEffect(() => {
        setCurrentIndex(0);
        setSkippedMatches([]);
    }, [matches]);

    const handleSwipeRight = useCallback(() => {
        if (currentIndex >= matches.length) return;

        const match = matches[currentIndex];

        // Optimistic update: Move to next card immediately
        setCurrentIndex(prev => prev + 1);

        // Perform async action
        onJoinMatch(match.id).catch(error => {
            console.error('Join match failed:', error);
            showError('Could not join match', 'This match may no longer be available.');
            // We could optionally revert the swipe here if needed
        });
    }, [currentIndex, matches, onJoinMatch]);

    const handleSwipeLeft = useCallback(() => {
        if (currentIndex >= matches.length) return;

        const match = matches[currentIndex];
        setSkippedMatches(prev => [...prev, match.id]);
        onSkipMatch?.(match.id);
        setCurrentIndex(prev => prev + 1);
    }, [currentIndex, matches, onSkipMatch]);

    const handleUndo = useCallback(() => {
        if (currentIndex <= 0) return;

        const prevMatch = matches[currentIndex - 1];
        setSkippedMatches(prev => prev.filter(id => id !== prevMatch.id));
        setCurrentIndex(prev => prev - 1);
    }, [currentIndex, matches]);

    // Filter visible matches (excluding those already swiped)
    const visibleMatches = matches.slice(currentIndex);

    if (matches.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="tennisball-outline" size={80} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Matches Available</Text>
                <Text style={styles.emptyText}>Create a match or check back later!</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (currentIndex >= matches.length) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={80} color={COLORS.primary} />
                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                <Text style={styles.emptyText}>You've seen all available matches</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={() => { setCurrentIndex(0); onRefresh(); }}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.refreshText}>See More Matches</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Cards Stack */}
            <View style={styles.cardsContainer}>
                {visibleMatches.slice(0, 3).reverse().map((match, index) => (
                    <MatchCard
                        key={match.id}
                        match={match}
                        isFirst={index === visibleMatches.slice(0, 3).length - 1}
                        onSwipeRight={handleSwipeRight}
                        onSwipeLeft={handleSwipeLeft}
                    />
                ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                {/* Undo Button */}
                <TouchableOpacity
                    style={[styles.actionButton, styles.undoButton, currentIndex === 0 && styles.actionButtonDisabled]}
                    onPress={handleUndo}
                    disabled={currentIndex === 0}
                >
                    <Ionicons name="arrow-undo" size={24} color="#FFF" />
                </TouchableOpacity>

                {/* Skip Button */}
                <TouchableOpacity
                    style={[styles.actionButton, styles.skipButton]}
                    onPress={handleSwipeLeft}
                >
                    <Ionicons name="close" size={36} color="#FFF" />
                </TouchableOpacity>

                {/* Join Button */}
                <TouchableOpacity
                    style={[styles.actionButton, styles.joinButton]}
                    onPress={handleSwipeRight}
                >
                    <Ionicons name="checkmark" size={36} color="#FFF" />
                </TouchableOpacity>

                {/* Info Button */}
                <TouchableOpacity
                    style={[styles.actionButton, styles.infoButton]}
                >
                    <Ionicons name="information-circle" size={28} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    {currentIndex + 1} / {matches.length}
                </Text>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${((currentIndex + 1) / matches.length) * 100}%` }
                        ]}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    cardsContainer: {
        height: 380,
        width: SCREEN_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10,
        zIndex: 10,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 24,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    refreshText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 16,
    },
    actionButton: {
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    actionButtonDisabled: {
        opacity: 0.3,
    },
    undoButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F59E0B',
        shadowColor: '#F59E0B',
    },
    skipButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
    },
    joinButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#00D084',
        shadowColor: '#00D084',
    },
    infoButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        shadowColor: '#3B82F6',
    },
    progressContainer: {
        alignItems: 'center',
        paddingBottom: 16,
    },
    progressText: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginBottom: 8,
    },
    progressBar: {
        width: 100,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
});
