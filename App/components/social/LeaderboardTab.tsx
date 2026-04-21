import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/colors';
import LeaderboardPodium from './LeaderboardPodium';
import LeaderboardRow from './LeaderboardRow';
import { SocialService, UserProfileSocial } from '../../services/social';
import { UserData } from '../../services/auth';



interface Props {
    currentUser: UserData | null;
}

function getRatingTier(rating: number): { label: string; color: string } {
    if (rating >= 1800) return { label: 'Elite', color: '#FFD700' };
    if (rating >= 1500) return { label: 'Diamond', color: '#60A5FA' };
    if (rating >= 1300) return { label: 'Platinum', color: '#A78BFA' };
    if (rating >= 1100) return { label: 'Gold', color: '#F59E0B' };
    if (rating >= 900)  return { label: 'Silver', color: '#CBD5E1' };
    return { label: 'Bronze', color: '#CD7F32' };
}

export default function LeaderboardTab({ currentUser }: Props) {
    const [players, setPlayers] = useState<UserProfileSocial[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [myRank, setMyRank] = useState<number | null>(null);
    const [myEntry, setMyEntry] = useState<UserProfileSocial | null>(null);

    const load = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const data: UserProfileSocial[] = await SocialService.getLeaderboard(100);
            setPlayers(data);
            if (currentUser?.id) {
                const idx = data.findIndex(p => p.id === currentUser.id);
                if (idx >= 0) {
                    setMyRank(idx + 1);
                    setMyEntry(data[idx]);
                }
            }
        } catch {
            setPlayers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser?.id]);

    useEffect(() => { load(); }, []);

    const visiblePlayers = players.filter(p => p.name && !p.name.toLowerCase().includes('test'));

    const topThree = visiblePlayers.slice(0, 3).map((p, i) => ({
        id: p.id,
        name: p.name,
        avatar_url: p.avatar_url,
        points: p.points,
        rank: i + 1,
    }));

    const rest = visiblePlayers.slice(3);

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.root}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => load(true)}
                    tintColor={COLORS.primary}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            {/* My ranking card */}
            {myEntry && myRank && (
                <View style={styles.myCard}>
                    <LinearGradientInline>
                        <View style={styles.myCardInner}>
                            <View>
                                <Text style={styles.myCardLabel}>Your Ranking</Text>
                                <Text style={styles.myCardRank}>#{myRank}</Text>
                            </View>
                            <View style={styles.myCardRight}>
                                <View style={[styles.tierBadge, { borderColor: getRatingTier(myEntry.skill_rating ?? 1000).color }]}>
                                    <Text style={[styles.tierText, { color: getRatingTier(myEntry.skill_rating ?? 1000).color }]}>
                                        {getRatingTier(myEntry.skill_rating ?? 1000).label}
                                    </Text>
                                </View>
                                <Text style={styles.myCardPts}>{myEntry.points.toLocaleString()} pts</Text>
                                <Text style={styles.myCardRating}>
                                    Elo {Math.round(myEntry.skill_rating ?? 1000)}
                                </Text>
                            </View>
                        </View>
                    </LinearGradientInline>
                </View>
            )}



            {/* Podium */}
            {topThree.length >= 3 && <LeaderboardPodium topThree={topThree} />}

            {/* Rows */}
            <Text style={styles.sectionTitle}>Full Rankings</Text>
            {rest.map((user, i) => (
                <LeaderboardRow
                    key={user.id}
                    user={{ ...user, level: undefined }}
                    rank={i + 4}
                    isCurrentUser={user.id === currentUser?.id}
                />
            ))}

            {players.length === 0 && (
                <View style={styles.empty}>
                    <Ionicons name="trophy-outline" size={56} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>No rankings yet</Text>
                    <Text style={styles.emptySubText}>Play matches to appear here</Text>
                </View>
            )}

            {/* Legend */}
            <View style={styles.legend}>
                <Text style={styles.legendTitle}>Elo Tiers</Text>
                <View style={styles.legendGrid}>
                    {[
                        { label: 'Bronze', color: '#CD7F32', range: '< 900' },
                        { label: 'Silver', color: '#CBD5E1', range: '900–1099' },
                        { label: 'Gold', color: '#F59E0B', range: '1100–1299' },
                        { label: 'Platinum', color: '#A78BFA', range: '1300–1499' },
                        { label: 'Diamond', color: '#60A5FA', range: '1500–1799' },
                        { label: 'Elite', color: '#FFD700', range: '1800+' },
                    ].map(t => (
                        <View key={t.label} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: t.color }]} />
                            <Text style={styles.legendLabel}>{t.label}</Text>
                            <Text style={styles.legendRange}>{t.range}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={{ height: 80 }} />
        </ScrollView>
    );
}

function LinearGradientInline({ children }: { children: React.ReactNode }) {
    return (
        <View style={styles.myCardGradient}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    myCard: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
    },
    myCardGradient: {
        backgroundColor: COLORS.primaryGlow,
        padding: SPACING.lg,
    },
    myCardInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    myCardLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
    myCardRank: { fontSize: 36, fontWeight: '800', color: COLORS.primary },
    myCardRight: { alignItems: 'flex-end', gap: 4 },
    tierBadge: {
        borderWidth: 1.5,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: RADIUS.pill,
    },
    tierText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    myCardPts: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    myCardRating: { fontSize: 12, color: COLORS.textMuted },

    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.textMuted,
        letterSpacing: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
    emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    emptySubText: { fontSize: 14, color: COLORS.textMuted },
    legend: {
        margin: SPACING.lg,
        padding: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    legendTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: SPACING.md },
    legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', width: '47%', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text, flex: 1 },
    legendRange: { fontSize: 11, color: COLORS.textMuted },
});
