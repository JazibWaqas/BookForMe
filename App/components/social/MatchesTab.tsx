import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS, SPACING, RADIUS } from '../../constants/colors';
import { SocialService, Match } from '../../services/social';
import { UserData } from '../../services/auth';

const SPORTS = ['All', 'Padel', 'Futsal', 'Cricket', 'Pickleball'];
const SPORT_ICONS: Record<string, string> = {
    padel: '🎾', futsal: '⚽', cricket: '🏏', pickleball: '🏓',
};
const sportIcon = (s: string) => SPORT_ICONS[s?.toLowerCase()] ?? '🏅';

interface Props {
    currentUser: UserData | null;
}

interface CreateForm {
    sport_type: string;
    match_type: 'casual' | 'ranked';
    date: string;
    time: string;
    location: string;
    max_players: string;
    description: string;
}

const EMPTY_FORM: CreateForm = {
    sport_type: 'Padel',
    match_type: 'casual',
    date: '',
    time: '',
    location: '',
    max_players: '4',
    description: '',
};

function spotsLeft(m: Match) {
    return m.max_players - (m.current_players ?? m.participants?.length ?? 1);
}

function MatchRow({ match, currentUserId, onJoin, joining }: {
    match: Match;
    currentUserId?: string;
    onJoin: (id: string) => void;
    joining: string | null;
}) {
    const spots = spotsLeft(match);
    const isJoined = match.participants?.some(p => p.id === currentUserId);
    const isHost = match.host_user_id === currentUserId;
    const isFull = spots <= 0;
    const ranked = match.match_type === 'ranked';

    return (
        <View style={styles.matchRow}>
            <View style={styles.matchRowLeft}>
                <Text style={styles.matchSportIcon}>{sportIcon(match.sport_type)}</Text>
            </View>
            <View style={styles.matchRowBody}>
                <View style={styles.matchRowTop}>
                    <Text style={styles.matchSport}>{match.sport_type}</Text>
                    <View style={[styles.typePill, ranked && styles.typePillRanked]}>
                        <Text style={[styles.typePillText, ranked && styles.typePillTextRanked]}>
                            {ranked ? '🏆 Ranked' : '⚡ Casual'}
                        </Text>
                    </View>
                </View>
                <View style={styles.matchMeta}>
                    <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.matchMetaText}>{match.date}</Text>
                    <Ionicons name="time-outline" size={12} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
                    <Text style={styles.matchMetaText}>{match.time}</Text>
                </View>
                <View style={styles.matchMeta}>
                    <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.matchMetaText} numberOfLines={1}>{match.location || 'TBD'}</Text>
                </View>
                {match.description ? (
                    <Text style={styles.matchDesc} numberOfLines={1}>{match.description}</Text>
                ) : null}
            </View>
            <View style={styles.matchRowRight}>
                <View style={[styles.spotsBadge, isFull && styles.spotsBadgeFull]}>
                    <Ionicons name="people" size={12} color={isFull ? COLORS.textMuted : COLORS.primary} />
                    <Text style={[styles.spotsText, isFull && styles.spotsTextFull]}>
                        {match.current_players}/{match.max_players}
                    </Text>
                </View>
                {!isHost && !isJoined && !isFull && (
                    <TouchableOpacity
                        style={styles.joinBtn}
                        onPress={() => onJoin(match.id)}
                        disabled={joining === match.id}
                    >
                        {joining === match.id
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.joinBtnText}>Join</Text>
                        }
                    </TouchableOpacity>
                )}
                {isJoined && !isHost && (
                    <View style={styles.joinedBadge}>
                        <Text style={styles.joinedText}>Joined</Text>
                    </View>
                )}
                {isHost && (
                    <View style={styles.hostBadge}>
                        <Text style={styles.hostText}>Host</Text>
                    </View>
                )}
                {isFull && !isJoined && !isHost && (
                    <View style={styles.fullBadge}>
                        <Text style={styles.fullText}>Full</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

export default function MatchesTab({ currentUser }: Props) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [myMatches, setMyMatches] = useState<Match[]>([]);
    const [suggested, setSuggested] = useState<Match[]>([]);
    const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeSport, setActiveSport] = useState('All');
    const [activeView, setActiveView] = useState<'open' | 'mine'>('open');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState<string | null>(null);
    const [resultModal, setResultModal] = useState<Match | null>(null);
    const [winners, setWinners] = useState<string[]>([]);

    // Date / Time picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [pickerDate, setPickerDate] = useState(new Date());

    const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
        setShowDatePicker(Platform.OS === 'ios'); // keep open on iOS
        if (selected) {
            setPickerDate(selected);
            const iso = selected.toISOString().split('T')[0]; // YYYY-MM-DD
            setForm(f => ({ ...f, date: iso }));
        }
    };

    const onTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selected) {
            const hh = selected.getHours().toString().padStart(2, '0');
            const mm = selected.getMinutes().toString().padStart(2, '0');
            setForm(f => ({ ...f, time: `${hh}:${mm}` }));
        }
    };

    const load = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true);
        else setLoading(true);
        try {
            const [all, sugg] = await Promise.all([
                SocialService.getMatches('all'),
                currentUser?.id ? SocialService.getSuggestedMatches(currentUser.id) : Promise.resolve([]),
            ]);
            const openAll = (all as Match[]).filter(m => m.status === 'open' || m.status === 'full');
            setMatches(openAll);
            if (currentUser?.id) {
                setMyMatches((all as Match[]).filter(
                    (m: Match) => m.host_user_id === currentUser.id ||
                         m.participants?.some(p => p.id === currentUser.id)
                ));
                // Top 3 suggestions, cap to avoid clutter
                setSuggested((sugg as Match[]).slice(0, 3));
                // Pre-compute friend IDs from suggestions for badge display
                const fids = new Set<string>();
                (sugg as Match[]).forEach((m: Match) => {
                    m.participants?.forEach(p => fids.add(p.id));
                    if (m.host_user_id) fids.add(m.host_user_id);
                });
                setFriendIds(fids);
            }
        } catch {
            setMatches([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser?.id]);

    useEffect(() => { load(); }, []);

    const filtered = activeSport === 'All'
        ? matches
        : matches.filter(m => m.sport_type.toLowerCase() === activeSport.toLowerCase());

    const handleJoin = async (matchId: string) => {
        if (!currentUser?.id) return;
        setJoining(matchId);
        try {
            await SocialService.joinMatch(matchId, currentUser.id);
            await load(true);
        } catch {
            Alert.alert('Error', 'Could not join match.');
        } finally {
            setJoining(null);
        }
    };

    const handleCreate = async () => {
        if (!currentUser?.id) return;
        if (!form.date || !form.time || !form.location) {
            Alert.alert('Missing fields', 'Date, time and location are required.');
            return;
        }
        setCreating(true);
        try {
            await SocialService.createMatch({
                host_user_id: currentUser.id,
                sport_type: form.sport_type,
                match_type: form.match_type,
                date: form.date,
                time: form.time,
                location: form.location,
                max_players: parseInt(form.max_players, 10) || 4,
                description: form.description || undefined,
            });
            setShowCreate(false);
            setForm(EMPTY_FORM);
            setActiveView('mine');
            load(true);
        } catch {
            Alert.alert('Error', 'Could not create match.');
        } finally {
            setCreating(false);
        }
    };

    const handleSubmitResult = async () => {
        if (!resultModal || !currentUser?.id) return;
        const allIds = resultModal.participants?.map(p => p.id) ?? [];
        const loserIds = allIds.filter(id => !winners.includes(id));
        if (!winners.length) { Alert.alert('Select winners first'); return; }
        try {
            await SocialService.submitMatchResult(resultModal.id, currentUser.id, winners, loserIds);
            Alert.alert('Done', 'Result recorded. Ratings updated.');
            setResultModal(null);
            setWinners([]);
            load(true);
        } catch {
            Alert.alert('Error', 'Could not submit result.');
        }
    };

    return (
        <View style={styles.root}>
            {/* View toggle + Create button */}
            <View style={styles.topRow}>
                <View style={styles.toggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, activeView === 'open' && styles.toggleBtnActive]}
                        onPress={() => setActiveView('open')}
                    >
                        <Text style={[styles.toggleText, activeView === 'open' && styles.toggleTextActive]}>Open</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, activeView === 'mine' && styles.toggleBtnActive]}
                        onPress={() => setActiveView('mine')}
                    >
                        <Text style={[styles.toggleText, activeView === 'mine' && styles.toggleTextActive]}>
                            My Matches {myMatches.length > 0 ? `(${myMatches.length})` : ''}
                        </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.createBtnText}>Create</Text>
                </TouchableOpacity>
            </View>

            {/* Sport filter — only for Open tab */}
            {activeView === 'open' && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterRow}
                >
                    {SPORTS.map(s => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.chip, activeSport === s && styles.chipActive]}
                            onPress={() => setActiveSport(s)}
                        >
                            <Text style={[styles.chipText, activeSport === s && styles.chipTextActive]}>
                                {s !== 'All' ? `${sportIcon(s)} ${s}` : 'All'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* List */}
            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Suggested for You (Open tab only) ── */}
                    {activeView === 'open' && suggested.length > 0 && (
                        <View style={styles.suggestedSection}>
                            <View style={styles.suggestedHeader}>
                                <Text style={styles.suggestedHeaderIcon}>⭐</Text>
                                <Text style={styles.suggestedHeaderText}>Suggested for You</Text>
                            </View>
                            {suggested.map(m => {
                                const hasFriend = m.participants?.some(p => friendIds.has(p.id)) || friendIds.has(m.host_user_id);
                                return (
                                    <View key={`sug-${m.id}`}>
                                        {hasFriend && (
                                            <View style={styles.friendBadgeRow}>
                                                <Ionicons name="people" size={11} color={COLORS.primary} />
                                                <Text style={styles.friendBadgeText}>A friend is playing</Text>
                                            </View>
                                        )}
                                        <MatchRow
                                            match={m}
                                            currentUserId={currentUser?.id}
                                            onJoin={handleJoin}
                                            joining={joining}
                                        />
                                    </View>
                                );
                            })}
                            <View style={styles.suggestedDivider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerLabel}>All Open Matches</Text>
                                <View style={styles.dividerLine} />
                            </View>
                        </View>
                    )}

                    {activeView === 'open' && filtered.length === 0 && suggested.length === 0 && (
                        <View style={styles.empty}>
                            <Ionicons name="tennisball-outline" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyTitle}>No open matches</Text>
                            <Text style={styles.emptyText}>Be the first — create one above</Text>
                        </View>
                    )}
                    {activeView === 'mine' && myMatches.length === 0 && (
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyTitle}>No matches yet</Text>
                            <Text style={styles.emptyText}>Create or join a match to see it here</Text>
                        </View>
                    )}

                    {(activeView === 'open' ? filtered : myMatches).map(m => (
                        <View key={m.id}>
                            <MatchRow
                                match={m}
                                currentUserId={currentUser?.id}
                                onJoin={handleJoin}
                                joining={joining}
                            />
                            {/* Submit result button for host on their own matches */}
                            {activeView === 'mine' && m.host_user_id === currentUser?.id && m.status !== 'completed' && (
                                <TouchableOpacity
                                    style={styles.resultTrigger}
                                    onPress={() => { setResultModal(m); setWinners([]); }}
                                >
                                    <Ionicons name="checkmark-done-outline" size={14} color={COLORS.accent} />
                                    <Text style={styles.resultTriggerText}>Submit Result</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    <View style={{ height: 80 }} />
                </ScrollView>
            )}

            {/* Create Modal */}
            <Modal visible={showCreate} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create a Match</Text>
                            <TouchableOpacity onPress={() => setShowCreate(false)}>
                                <Ionicons name="close" size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Sport</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                                {SPORTS.filter(s => s !== 'All').map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.sportOpt, form.sport_type === s && styles.sportOptActive]}
                                        onPress={() => setForm(f => ({ ...f, sport_type: s }))}
                                    >
                                        <Text style={styles.sportOptIcon}>{sportIcon(s)}</Text>
                                        <Text style={[styles.sportOptText, form.sport_type === s && styles.sportOptTextActive]}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.label}>Type</Text>
                            <View style={styles.typeRow}>
                                {(['casual', 'ranked'] as const).map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.typeOpt, form.match_type === t && styles.typeOptActive]}
                                        onPress={() => setForm(f => ({ ...f, match_type: t }))}
                                    >
                                        <Text style={styles.typeOptIcon}>{t === 'ranked' ? '🏆' : '⚡'}</Text>
                                        <Text style={[styles.typeOptText, form.match_type === t && styles.typeOptTextActive]}>
                                            {t === 'ranked' ? 'Ranked' : 'Casual'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {form.match_type === 'ranked' && (
                                <Text style={styles.rankedNote}>Ranked affects Elo ratings. Submit result after the match.</Text>
                            )}

                            <Text style={styles.label}>Date</Text>
                            <TouchableOpacity
                                style={styles.pickerButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                                <Text style={[styles.pickerButtonText, !form.date && { color: COLORS.textMuted }]}>
                                    {form.date || 'Select date...'}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={pickerDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                                    minimumDate={new Date()}
                                    onChange={onDateChange}
                                />
                            )}

                            <Text style={styles.label}>Time</Text>
                            <TouchableOpacity
                                style={styles.pickerButton}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                                <Text style={[styles.pickerButtonText, !form.time && { color: COLORS.textMuted }]}>
                                    {form.time || 'Select time...'}
                                </Text>
                            </TouchableOpacity>
                            {showTimePicker && (
                                <DateTimePicker
                                    value={pickerDate}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                                    is24Hour
                                    onChange={onTimeChange}
                                />
                            )}
                            <Text style={styles.label}>Location</Text>
                            <TextInput style={styles.input} placeholder="Venue or area" placeholderTextColor={COLORS.textMuted} value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))} />
                            <Text style={styles.label}>Max Players</Text>
                            <TextInput style={styles.input} placeholder="4" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={form.max_players} onChangeText={v => setForm(f => ({ ...f, max_players: v }))} />
                            <Text style={styles.label}>Description (optional)</Text>
                            <TextInput style={[styles.input, { height: 72, textAlignVertical: 'top' }]} placeholder="Looking for 2 more players..." placeholderTextColor={COLORS.textMuted} multiline value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} />

                            <TouchableOpacity style={[styles.submitBtn, creating && { opacity: 0.6 }]} onPress={handleCreate} disabled={creating}>
                                {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Match</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Submit Result Modal */}
            <Modal visible={!!resultModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { paddingBottom: SPACING.xl }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Submit Result</Text>
                            <TouchableOpacity onPress={() => setResultModal(null)}>
                                <Ionicons name="close" size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.resultNote}>Tap players who won:</Text>
                        {resultModal?.participants?.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                style={[styles.playerRow, winners.includes(p.id) && styles.playerRowWin]}
                                onPress={() => setWinners(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                            >
                                <Ionicons name={winners.includes(p.id) ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={winners.includes(p.id) ? COLORS.primary : COLORS.textMuted} />
                                <Text style={styles.playerName}>{p.name}</Text>
                                {winners.includes(p.id) && <Text style={styles.winTag}>Winner</Text>}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[styles.submitBtn, { marginTop: SPACING.lg }]} onPress={handleSubmitResult}>
                            <Text style={styles.submitBtnText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    // Suggested section
    suggestedSection: {
        marginTop: 4,
    },
    suggestedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SPACING.lg,
        paddingBottom: 8,
        paddingTop: 4,
    },
    suggestedHeaderIcon: { fontSize: 14 },
    suggestedHeaderText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.3,
    },
    friendBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginHorizontal: SPACING.lg,
        marginBottom: -6,
        marginTop: 4,
    },
    friendBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.primary,
    },
    suggestedDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginTop: 6,
        marginBottom: 10,
        gap: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textMuted,
        letterSpacing: 0.5,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: 6,
    },
    toggle: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.pill,
        padding: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    toggleBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: RADIUS.pill,
    },
    toggleBtnActive: { backgroundColor: COLORS.primary },
    toggleText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
    toggleTextActive: { color: '#fff', fontWeight: '700' },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.primary,
    },
    createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    filterScroll: {
        width: '100%',
        maxHeight: 40,
        marginBottom: 6,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: 0,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
    chipIcon: { fontSize: 13, marginRight: 4 },
    chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
    chipTextActive: { color: COLORS.primary },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { flex: 1 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    emptyText: { fontSize: 13, color: COLORS.textMuted },

    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginBottom: 10,
        padding: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    matchRowLeft: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.surfaceRaised,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    matchSportIcon: { fontSize: 22 },
    matchRowBody: { flex: 1, gap: 4 },
    matchRowTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    matchSport: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    typePill: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.primaryGlow,
    },
    typePillRanked: { backgroundColor: COLORS.accentGlow },
    typePillText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
    typePillTextRanked: { color: COLORS.accent },
    matchMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    matchMetaText: { fontSize: 13, color: COLORS.textMuted },
    matchDesc: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 2 },
    matchRowRight: { alignItems: 'center', gap: 6, marginLeft: SPACING.sm },
    spotsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.primaryGlow,
    },
    spotsBadgeFull: { backgroundColor: COLORS.surfaceRaised },
    spotsText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
    spotsTextFull: { color: COLORS.textMuted },
    joinBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.primary,
        minWidth: 52,
        alignItems: 'center',
    },
    joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    joinedBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    joinedText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
    hostBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.accentGlow,
        borderWidth: 1,
        borderColor: COLORS.accent,
    },
    hostText: { fontSize: 11, color: COLORS.accent, fontWeight: '700' },
    fullBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.surfaceRaised,
    },
    fullText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
    resultTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginHorizontal: SPACING.lg,
        marginBottom: 12,
        marginTop: -4,
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        backgroundColor: COLORS.accentGlow,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.accent + '40',
        alignSelf: 'flex-start',
    },
    resultTriggerText: { fontSize: 12, color: COLORS.accent, fontWeight: '700' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.xl,
        maxHeight: '88%',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
    modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    label: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 6, marginTop: SPACING.md },
    sportOpt: {
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceRaised,
        marginRight: 8,
    },
    sportOptActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
    sportOptIcon: { fontSize: 18, marginBottom: 2 },
    sportOptText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
    sportOptTextActive: { color: COLORS.primary },
    typeRow: { flexDirection: 'row', gap: 10 },
    typeOpt: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceRaised,
    },
    typeOptActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
    typeOptIcon: { fontSize: 16 },
    typeOptText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
    typeOptTextActive: { color: COLORS.primary },
    rankedNote: { fontSize: 11, color: COLORS.accent, marginTop: 6, marginBottom: 2 },
    input: {
        backgroundColor: COLORS.surfaceRaised,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        paddingVertical: 11,
        color: COLORS.text,
        fontSize: 14,
        marginBottom: 4,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.surfaceRaised,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        paddingVertical: 13,
        marginBottom: 4,
    },
    pickerButtonText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.pill,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    resultNote: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceRaised,
        marginBottom: 8,
    },
    playerRowWin: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
    playerName: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '600' },
    winTag: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
});
