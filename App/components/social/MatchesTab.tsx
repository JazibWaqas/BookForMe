import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    TextInput, ScrollView, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, RefreshControl, Pressable, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/colors';
import { SocialService, Match } from '../../services/social';
import { UserData } from '../../services/auth';
import Avatar from '../ui/Avatar';

// ─── Sport config ─────────────────────────────────────────────────────────────

const SPORT_ICON: Record<string, string> = {
    padel:       'tennis',
    tennis:      'tennis',
    futsal:      'soccer',
    football:    'soccer',
    cricket:     'cricket',
    basketball:  'basketball',
    badminton:   'badminton',
    pickleball:  'table-tennis',
    squash:      'tennis',
    volleyball:  'volleyball',
};
const getSportIcon = (s: string): string =>
    SPORT_ICON[s?.toLowerCase()] ?? 'trophy-outline';

const SPORT_DESC: Record<string, string> = {
    padel:      'e.g. Intermediate doubles, 1 spot left. Rackets available on site.',
    tennis:     'e.g. Singles, any level. Balls provided.',
    futsal:     'e.g. 5-a-side. All levels welcome. Bibs and ball provided.',
    football:   'e.g. 7-a-side. Bring water. Boots optional.',
    cricket:    'e.g. Tennis ball match. 11-a-side. Bring your own bat.',
    basketball: 'e.g. 3-on-3, half court. All welcome.',
    pickleball: 'e.g. Mixed doubles, beginner-friendly. Paddles available.',
    badminton:  'e.g. Doubles, intermediate. Court booked for 90 min.',
};
const getSportDesc = (s: string) => SPORT_DESC[s?.toLowerCase()] ?? '';

const DEFAULT_MAX: Record<string, string> = {
    padel: '4', futsal: '10', football: '14', cricket: '22',
    basketball: '10', pickleball: '4', badminton: '4', tennis: '2',
};
const getDefaultMax = (s: string) => DEFAULT_MAX[s?.toLowerCase()] ?? '4';

const SPORT_LIST = ['All', 'Padel', 'Futsal', 'Cricket', 'Pickleball'];

const SCREEN_H = Dimensions.get('window').height;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDateShort = (s: string) => {
    if (!s) return '';
    try {
        const d = new Date(s + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch { return s; }
};

const formatDateLong = (s: string) => {
    if (!s) return '';
    try {
        const d = new Date(s + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return s; }
};

const formatTime12 = (t: string) => {
    if (!t) return '';
    try {
        const [hh, mm] = t.split(':').map(Number);
        const ampm = hh >= 12 ? 'PM' : 'AM';
        return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${ampm}`;
    } catch { return t; }
};

const spotsLeft = (m: Match) =>
    m.max_players - (m.current_players ?? m.participants?.length ?? 1);

interface Props { currentUser: UserData | null; }

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
    sport_type: 'Padel', match_type: 'casual',
    date: '', time: '', location: '', max_players: '4', description: '',
};

// ─── MatchCard ────────────────────────────────────────────────────────────────

function MatchCard({ match, currentUserId, onPress, onJoin, joining }: {
    match: Match;
    currentUserId?: string;
    onPress: () => void;
    onJoin: (id: string) => void;
    joining: string | null;
}) {
    const spots    = spotsLeft(match);
    const isJoined = match.participants?.some(p => p.id === currentUserId);
    const isHost   = match.host_user_id === currentUserId;
    const isFull   = spots <= 0;
    const ranked   = match.match_type === 'ranked';
    const urgency  = spots === 1 && !isFull;
    const fillPct  = Math.round((match.current_players / match.max_players) * 100);

    return (
        <TouchableOpacity
            style={[
                styles.card,
                ranked ? styles.cardRanked : styles.cardCasual,
            ]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            {/* Coloured top accent strip */}
            <View style={[styles.cardAccent, { backgroundColor: ranked ? COLORS.accent : COLORS.primary }]} />

            <View style={styles.cardInner}>
                {/* Sport icon */}
                <View style={styles.cardIconWrap}>
                    <MaterialCommunityIcons
                        name={getSportIcon(match.sport_type) as any}
                        size={22}
                        color={COLORS.primary}
                    />
                </View>

                {/* Main content */}
                <View style={styles.cardContent}>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardSport}>{match.sport_type}</Text>
                        {ranked && (
                            <View style={styles.rankedPill}>
                                <Text style={styles.rankedPillText}>Ranked</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.cardMeta}>
                        {formatDateShort(match.date)}
                        {match.time ? `  ·  ${formatTime12(match.time)}` : ''}
                    </Text>
                    {match.location ? (
                        <Text style={styles.cardLocation} numberOfLines={1}>{match.location}</Text>
                    ) : null}

                    {/* Spots bar */}
                    <View style={styles.spotsRow}>
                        <View style={styles.spotsBarTrack}>
                            <View
                                style={[
                                    styles.spotsBarFill,
                                    { width: `${fillPct}%` as any },
                                    isFull && { backgroundColor: COLORS.textMuted },
                                    urgency && { backgroundColor: COLORS.accent },
                                ]}
                            />
                        </View>
                        <View style={styles.avatarStack}>
                            {(match.participants ?? []).slice(0, 3).map((p, i) => (
                                <View key={p.id} style={[styles.avatarWrap, { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i }]}>
                                    <Avatar uri={p.avatar_url} name={p.name || '?'} size={20} />
                                </View>
                            ))}
                        </View>
                        <Text style={[styles.cardPlayerCount, urgency && { color: COLORS.accent }]}>
                            {match.current_players}/{match.max_players}
                            {urgency ? '  ·  1 spot left' : ''}
                        </Text>
                    </View>
                </View>

                {/* Action */}
                <View style={styles.cardAction}>
                    {isHost ? (
                        <Text style={styles.hostLabel}>Host</Text>
                    ) : isJoined ? (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    ) : isFull ? (
                        <Text style={styles.fullLabel}>Full</Text>
                    ) : (
                        <TouchableOpacity
                            style={styles.joinBtn}
                            onPress={() => { onJoin(match.id); }}
                            disabled={joining === match.id}
                            activeOpacity={0.8}
                        >
                            {joining === match.id
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={styles.joinBtnText}>Join</Text>}
                        </TouchableOpacity>
                    )}
                    <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} style={{ marginTop: 4 }} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── MatchDetailModal ─────────────────────────────────────────────────────────

function MatchDetailModal({ match, currentUserId, visible, onClose, onJoin, onSubmitResult, joining }: {
    match: Match | null;
    currentUserId?: string;
    visible: boolean;
    onClose: () => void;
    onJoin: (id: string) => void;
    onSubmitResult: (m: Match) => void;
    joining: string | null;
}) {
    if (!match) return null;

    const spots    = spotsLeft(match);
    const isJoined = match.participants?.some(p => p.id === currentUserId);
    const isHost   = match.host_user_id === currentUserId;
    const isFull   = spots <= 0 && !isJoined && !isHost;
    const ranked   = match.match_type === 'ranked';
    const host     = match.participants?.find(p => p.id === match.host_user_id)
        ?? (match.host_user_id ? { id: match.host_user_id, name: 'Host', avatar_url: undefined, rank: 0, points: 0 } : null);

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={styles.matchDetailSheet}>
                    {/* Coloured header bar */}
                    <View style={[styles.detailTopBar, { backgroundColor: ranked ? COLORS.accent : COLORS.primary }]} />
                    <View style={styles.sheetHandle} />

                    {/* Header */}
                    <View style={styles.detailHead}>
                        <View style={styles.detailHeadLeft}>
                            <View style={[styles.detailIconWrap, ranked && { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent + '40' }]}>
                                <MaterialCommunityIcons
                                    name={getSportIcon(match.sport_type) as any}
                                    size={28}
                                    color={ranked ? COLORS.accent : COLORS.primary}
                                />
                            </View>
                            <View style={{ marginLeft: 14, flex: 1 }}>
                                <Text style={styles.detailSport}>{match.sport_type}</Text>
                                <Text style={[styles.detailType, ranked && { color: COLORS.accent }]}>
                                    {ranked ? '🏆 Ranked  ·  affects Elo' : 'Casual match'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <Ionicons name="close" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {host && (
                        <View style={styles.hostRow}>
                            <Avatar uri={host.avatar_url} name={host.name || '?'} size={24} />
                            <Text style={styles.hostLabel2}>
                                Organized by{' '}
                                <Text style={{ color: COLORS.text, fontWeight: '700' }}>
                                    {host.name && host.name !== 'Unknown User' ? host.name : 'the host'}
                                </Text>
                            </Text>
                        </View>
                    )}

                    <View style={styles.infoBlock}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={15} color={COLORS.textMuted} />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.infoLabel}>Date</Text>
                                <Text style={styles.infoValue}>
                                    {match.date ? formatDateLong(match.date) : 'TBD'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoSep} />
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={15} color={COLORS.textMuted} />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.infoLabel}>Time</Text>
                                <Text style={styles.infoValue}>
                                    {match.time ? formatTime12(match.time) : 'TBD'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoSep} />
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={15} color={COLORS.textMuted} />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.infoLabel}>Venue</Text>
                                <Text style={styles.infoValue}>{(match.location || '').trim() || 'TBD'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.detailDivider} />

                    {/* Scrollable: players, notes, host actions */}
                    <ScrollView
                        style={{ maxHeight: SCREEN_H * 0.42 }}
                        contentContainerStyle={{ paddingBottom: 24 }}
                        showsVerticalScrollIndicator
                    >

                        {/* Players */}
                        <Text style={styles.sectionTitle}>
                            Players  <Text style={styles.sectionDim}>{match.current_players}/{match.max_players}</Text>
                        </Text>
                        <View style={styles.infoBlock}>
                            {(match.participants ?? []).map((p, i) => (
                                <View key={p.id}>
                                    {i > 0 && <View style={styles.infoSep} />}
                                    <View style={styles.playerRow}>
                                        <Avatar uri={p.avatar_url} name={p.name || '?'} size={34} />
                                        <View style={{ marginLeft: 12, flex: 1 }}>
                                            <Text style={styles.playerName}>{p.name}</Text>
                                            {p.skill_rating != null && (
                                                <Text style={styles.playerSub}>Rating {Math.round(p.skill_rating)}</Text>
                                            )}
                                        </View>
                                        {p.id === match.host_user_id && (
                                            <Text style={styles.playerTag}>Host</Text>
                                        )}
                                        {p.id === currentUserId && p.id !== match.host_user_id && (
                                            <Text style={[styles.playerTag, { color: COLORS.primary }]}>You</Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                            {/* Open slots */}
                            {Array.from({ length: Math.max(0, spots) }).map((_, i) => (
                                <View key={`open-${i}`}>
                                    <View style={styles.infoSep} />
                                    <View style={[styles.playerRow, { opacity: 0.35 }]}>
                                        <View style={styles.openSlot}>
                                            <Ionicons name="person-add-outline" size={14} color={COLORS.textMuted} />
                                        </View>
                                        <Text style={[styles.playerName, { color: COLORS.textMuted, marginLeft: 12 }]}>Open spot</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Description */}
                        {match.description ? (
                            <>
                                <Text style={styles.sectionTitle}>Notes</Text>
                                <View style={styles.infoBlock}>
                                    <Text style={styles.descText}>{match.description}</Text>
                                </View>
                            </>
                        ) : null}

                        {/* Host: submit result */}
                        {isHost && match.status !== 'completed' && (
                            <>
                                <Text style={styles.sectionTitle}>Host</Text>
                                <TouchableOpacity style={styles.resultRow} onPress={() => onSubmitResult(match)} activeOpacity={0.8}>
                                    <Ionicons name="checkmark-done-outline" size={16} color={COLORS.accent} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.resultLabel}>Submit Match Result</Text>
                                        <Text style={styles.resultSub}>Declare winners to update Elo ratings</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={14} color={COLORS.accent} />
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>

                    {/* Footer CTA */}
                    {!isHost && (
                        <View style={styles.detailFooter}>
                            {isJoined ? (
                                <View style={styles.joinedState}>
                                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                                    <Text style={styles.joinedStateText}>You're in</Text>
                                </View>
                            ) : isFull ? (
                                <View style={styles.fullState}>
                                    <Text style={styles.fullStateText}>Match is full</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.detailJoinBtn, joining === match.id && { opacity: 0.7 }]}
                                    onPress={() => onJoin(match.id)}
                                    disabled={joining === match.id}
                                    activeOpacity={0.88}
                                >
                                    {joining === match.id
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={styles.detailJoinBtnText}>Join Match</Text>}
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

// ─── CreateMatchModal ─────────────────────────────────────────────────────────

function CreateMatchModal({ visible, onClose, onSubmit, creating }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (form: CreateForm) => void;
    creating: boolean;
}) {
    const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
    const [showDate, setShowDate] = useState(false);
    const [showTime, setShowTime] = useState(false);
    const [pickerDate, setPickerDate] = useState(new Date());

    useEffect(() => { if (visible) setForm(EMPTY_FORM); }, [visible]);

    const selectSport = (s: string) =>
        setForm(f => ({ ...f, sport_type: s, max_players: getDefaultMax(s) }));

    const onDateChange = (_: DateTimePickerEvent, d?: Date) => {
        setShowDate(Platform.OS === 'ios');
        if (d) { setPickerDate(d); setForm(f => ({ ...f, date: d.toISOString().split('T')[0] })); }
    };
    const onTimeChange = (_: DateTimePickerEvent, d?: Date) => {
        setShowTime(Platform.OS === 'ios');
        if (d) {
            const hh = d.getHours().toString().padStart(2, '0');
            const mm = d.getMinutes().toString().padStart(2, '0');
            setForm(f => ({ ...f, time: `${hh}:${mm}` }));
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.sheetHandle} />
                    <View style={styles.sheetHead}>
                        <View>
                            <Text style={styles.sheetTitle}>Create a Match</Text>
                            <Text style={styles.sheetSub}>Find players to complete your team</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>

                        {/* Sport */}
                        <Text style={styles.fieldLabel}>SPORT</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {SPORT_LIST.filter(s => s !== 'All').map(s => {
                                const active = form.sport_type === s;
                                return (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.sportOpt, active && styles.sportOptActive]}
                                        onPress={() => selectSport(s)}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialCommunityIcons
                                            name={getSportIcon(s) as any}
                                            size={20}
                                            color={active ? COLORS.primary : COLORS.textMuted}
                                        />
                                        <Text style={[styles.sportOptLabel, active && { color: COLORS.primary, fontWeight: '700' }]}>{s}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Match type */}
                        <Text style={styles.fieldLabel}>TYPE</Text>
                        <View style={styles.typeRow}>
                            {(['casual', 'ranked'] as const).map(t => {
                                const active = form.match_type === t;
                                const isRanked = t === 'ranked';
                                return (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.typeOpt, active && styles.typeOptActive]}
                                        onPress={() => setForm(f => ({ ...f, match_type: t }))}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name={isRanked ? 'trophy-outline' : 'flash-outline'}
                                            size={16}
                                            color={active ? COLORS.primary : COLORS.textMuted}
                                        />
                                        <View style={{ marginLeft: 8 }}>
                                            <Text style={[styles.typeOptTitle, active && { color: COLORS.primary }]}>
                                                {isRanked ? 'Ranked' : 'Casual'}
                                            </Text>
                                            <Text style={styles.typeOptSub}>
                                                {isRanked ? 'Updates Elo rating' : 'No pressure, just play'}
                                            </Text>
                                        </View>
                                        {active && (
                                            <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginLeft: 'auto' }} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Date & Time */}
                        <View style={styles.dateTimeRow}>
                            <View style={{ flex: 1, marginRight: 6 }}>
                                <Text style={styles.fieldLabel}>DATE</Text>
                                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDate(true)}>
                                    <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                                    <Text style={[styles.pickerBtnText, !form.date && styles.placeholder]}>
                                        {form.date ? formatDateShort(form.date) : 'Select'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1, marginLeft: 6 }}>
                                <Text style={styles.fieldLabel}>TIME</Text>
                                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTime(true)}>
                                    <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                                    <Text style={[styles.pickerBtnText, !form.time && styles.placeholder]}>
                                        {form.time ? formatTime12(form.time) : 'Select'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {showDate && (
                            <DateTimePicker value={pickerDate} mode="date" minimumDate={new Date()} onChange={onDateChange} />
                        )}
                        {showTime && (
                            <DateTimePicker value={pickerDate} mode="time" is24Hour onChange={onTimeChange} />
                        )}

                        {/* Location */}
                        <Text style={styles.fieldLabel}>VENUE</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. DHA Sports Complex, Karachi"
                                placeholderTextColor={COLORS.textMuted}
                                value={form.location}
                                onChangeText={v => setForm(f => ({ ...f, location: v }))}
                            />
                        </View>

                        {/* Max players */}
                        <Text style={styles.fieldLabel}>MAX PLAYERS</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={form.max_players}
                                onChangeText={v => setForm(f => ({ ...f, max_players: v }))}
                            />
                        </View>

                        {/* Description */}
                        <Text style={styles.fieldLabel}>
                            NOTES <Text style={{ color: COLORS.textMuted, fontWeight: '400', letterSpacing: 0 }}>(optional)</Text>
                        </Text>
                        <View style={[styles.inputWrap, { alignItems: 'flex-start', paddingTop: 10 }]}>
                            <TextInput
                                style={[styles.input, { height: 76, textAlignVertical: 'top' }]}
                                placeholder={getSportDesc(form.sport_type) || 'Any notes for your teammates…'}
                                placeholderTextColor={COLORS.textMuted}
                                multiline
                                value={form.description}
                                onChangeText={v => setForm(f => ({ ...f, description: v }))}
                            />
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitBtn, creating && { opacity: 0.65 }]}
                            onPress={() => onSubmit(form)}
                            disabled={creating}
                            activeOpacity={0.88}
                        >
                            {creating
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.submitBtnText}>Post Match</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── SubmitResultModal ────────────────────────────────────────────────────────

function SubmitResultModal({ match, visible, onClose, onSubmit }: {
    match: Match | null;
    visible: boolean;
    onClose: () => void;
    onSubmit: (winners: string[]) => void;
}) {
    const [winners, setWinners] = useState<string[]>([]);
    useEffect(() => { if (visible) setWinners([]); }, [visible]);

    const toggle = (id: string) =>
        setWinners(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={[styles.sheet, { maxHeight: '60%' }]}>
                    <View style={styles.sheetHandle} />
                    <View style={styles.sheetHead}>
                        <View>
                            <Text style={styles.sheetTitle}>Match Result</Text>
                            <Text style={styles.sheetSub}>Select the players who won</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.sheetBody}>
                        {match?.participants?.map(p => {
                            const won = winners.includes(p.id);
                            return (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.resultPlayerRow, won && styles.resultPlayerRowWin]}
                                    onPress={() => toggle(p.id)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.checkbox, won && styles.checkboxActive]}>
                                        {won && <Ionicons name="checkmark" size={12} color="#fff" />}
                                    </View>
                                    <Avatar uri={p.avatar_url} name={p.name || '?'} size={34} />
                                    <Text style={styles.resultName}>{p.name}</Text>
                                    {won && <Text style={styles.winLabel}>Winner</Text>}
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity
                            style={[styles.submitBtn, { marginTop: SPACING.lg }, !winners.length && { opacity: 0.4 }]}
                            onPress={() => winners.length && onSubmit(winners)}
                            activeOpacity={0.88}
                        >
                            <Text style={styles.submitBtnText}>Confirm Result</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── MatchesTab ───────────────────────────────────────────────────────────────

export default function MatchesTab({ currentUser }: Props) {
    const [matches,     setMatches]     = useState<Match[]>([]);
    const [myMatches,   setMyMatches]   = useState<Match[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [refreshing,  setRefreshing]  = useState(false);
    const [activeSport, setActiveSport] = useState('All');
    const [activeView,  setActiveView]  = useState<'open' | 'mine'>('open');
    const [showCreate,  setShowCreate]  = useState(false);
    const [creating,    setCreating]    = useState(false);
    const [joining,     setJoining]     = useState<string | null>(null);
    const [detailMatch, setDetailMatch] = useState<Match | null>(null);
    const [resultMatch, setResultMatch] = useState<Match | null>(null);

    const load = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        try {
            const all = await SocialService.getMatches('all') as Match[];
            setMatches(all.filter(m => m.status === 'open' || m.status === 'full'));
            if (currentUser?.id) {
                setMyMatches(all.filter(m =>
                    m.host_user_id === currentUser.id || m.participants?.some(p => p.id === currentUser.id)
                ));
            }
        } catch { setMatches([]); }
        finally { setLoading(false); setRefreshing(false); }
    }, [currentUser?.id]);

    useEffect(() => { load(); }, []);

    const filtered = activeSport === 'All'
        ? matches
        : matches.filter(m => m.sport_type.toLowerCase() === activeSport.toLowerCase());

    const handleJoin = async (matchId: string) => {
        if (!currentUser?.id) { Alert.alert('Sign in required'); return; }
        setJoining(matchId);
        try {
            await SocialService.joinMatch(matchId, currentUser.id);
            await load(true);
        } catch { Alert.alert('Could not join', 'This match may no longer be available.'); }
        finally { setJoining(null); }
    };

    const handleCreate = async (form: CreateForm) => {
        if (!form.date || !form.time || !form.location) {
            Alert.alert('Missing details', 'Please set the date, time, and venue.'); return;
        }
        setCreating(true);
        try {
            await SocialService.createMatch({
                host_user_id: currentUser!.id,
                sport_type: form.sport_type,
                match_type: form.match_type,
                date: form.date, time: form.time,
                location: form.location,
                max_players: parseInt(form.max_players, 10) || 4,
                description: form.description || undefined,
            });
            setShowCreate(false);
            setActiveView('mine');
            load(true);
        } catch { Alert.alert('Error', 'Could not post match. Please try again.'); }
        finally { setCreating(false); }
    };

    const handleResult = async (winners: string[]) => {
        if (!resultMatch || !currentUser?.id) return;
        const losers = (resultMatch.participants ?? []).map(p => p.id).filter(id => !winners.includes(id));
        try {
            await SocialService.submitMatchResult(resultMatch.id, currentUser.id, winners, losers);
            Alert.alert('Done', 'Result submitted and ratings updated.');
            setResultMatch(null); setDetailMatch(null); load(true);
        } catch { Alert.alert('Error', 'Could not submit result.'); }
    };

    const display = activeView === 'open' ? filtered : myMatches;

    return (
        <View style={styles.root}>

            {/* Top controls */}
            <View style={styles.topRow}>
                <View style={styles.toggle}>
                    {(['open', 'mine'] as const).map(v => (
                        <TouchableOpacity
                            key={v}
                            style={[styles.toggleBtn, activeView === v && styles.toggleBtnActive]}
                            onPress={() => setActiveView(v)}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.toggleText, activeView === v && styles.toggleTextActive]}>
                                {v === 'open' ? 'Open Matches' : `My Matches${myMatches.length ? ` (${myMatches.length})` : ''}`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity onPress={() => setShowCreate(true)} activeOpacity={0.85}>
                    <View style={styles.createBtn}>
                        <Ionicons name="add" size={16} color="#fff" />
                        <Text style={styles.createBtnText}>Create</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Sport chips */}
            {activeView === 'open' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
                    {SPORT_LIST.map(s => {
                        const active = activeSport === s;
                        return (
                            <TouchableOpacity
                                key={s}
                                style={[styles.chip, active && styles.chipActive]}
                                onPress={() => setActiveSport(s)}
                                activeOpacity={0.75}
                            >
                                {s !== 'All' && (
                                    <MaterialCommunityIcons
                                        name={getSportIcon(s) as any}
                                        size={13}
                                        color={active ? COLORS.primary : COLORS.textMuted}
                                    />
                                )}
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                    {s === 'All' ? 'All Sports' : s}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* List */}
            {loading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator color={COLORS.primary} />
                    <Text style={styles.loaderText}>Loading matches…</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />}
                    showsVerticalScrollIndicator={false}
                >
                    {display.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <MaterialCommunityIcons
                                name={activeSport !== 'All' ? getSportIcon(activeSport) as any : 'calendar-search'}
                                size={36}
                                color={COLORS.textMuted}
                            />
                            <Text style={styles.emptyTitle}>
                                {activeView === 'mine' ? 'No matches yet' : 'No open matches'}
                            </Text>
                            <Text style={styles.emptyBody}>
                                {activeView === 'mine'
                                    ? 'Join an open match or create your own.'
                                    : 'Be the first — create a match and find players.'}
                            </Text>
                        </View>
                    ) : (
                        display.map(m => (
                            <MatchCard
                                key={m.id}
                                match={m}
                                currentUserId={currentUser?.id}
                                onPress={() => setDetailMatch(m)}
                                onJoin={handleJoin}
                                joining={joining}
                            />
                        ))
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}

            {/* Modals */}
            <MatchDetailModal
                match={detailMatch}
                currentUserId={currentUser?.id}
                visible={!!detailMatch}
                onClose={() => setDetailMatch(null)}
                onJoin={handleJoin}
                onSubmitResult={m => { setDetailMatch(null); setResultMatch(m); }}
                joining={joining}
            />
            <CreateMatchModal
                visible={showCreate}
                onClose={() => setShowCreate(false)}
                onSubmit={handleCreate}
                creating={creating}
            />
            <SubmitResultModal
                match={resultMatch}
                visible={!!resultMatch}
                onClose={() => setResultMatch(null)}
                onSubmit={handleResult}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },

    // Top controls
    topRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    },
    toggle: {
        flexDirection: 'row', backgroundColor: COLORS.surface,
        borderRadius: RADIUS.pill, padding: 3,
        borderWidth: 1, borderColor: COLORS.border,
    },
    toggleBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.pill },
    toggleBtnActive: { backgroundColor: COLORS.primary },
    toggleText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
    toggleTextActive: { color: '#fff', fontWeight: '700' },
    createBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
        paddingVertical: 9, paddingHorizontal: 16,
    },
    createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    // Chips
    chipScroll: { maxHeight: 44 },
    chipRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, gap: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: RADIUS.pill, backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.border,
    },
    chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
    chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
    chipTextActive: { color: COLORS.primary, fontWeight: '700' },

    // Loader / empty
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    loaderText: { fontSize: 13, color: COLORS.textMuted },
    emptyWrap: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 40, gap: 8 },
    emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 8 },
    emptyBody: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },

    // List
    list: { flex: 1 },
    listContent: { paddingTop: 8 },

    // Match card
    card: {
        marginHorizontal: SPACING.lg, marginBottom: 10,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1, borderColor: COLORS.border,
        overflow: 'hidden',
        ...SHADOWS.card,
    },
    cardCasual: { borderTopColor: COLORS.primary + '55' },
    cardRanked: { borderTopColor: COLORS.accent + '55' },
    cardAccent: { height: 3, width: '100%' },
    cardInner: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md },
    cardIconWrap: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: COLORS.primaryGlow,
        borderWidth: 1, borderColor: COLORS.primary + '30',
        justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0,
    },
    cardContent: { flex: 1 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    cardSport: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    rankedPill: {
        backgroundColor: COLORS.accentGlow, borderRadius: RADIUS.pill,
        paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.accent + '40',
    },
    rankedPillText: { fontSize: 10, fontWeight: '700', color: COLORS.accent },
    cardMeta: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
    cardLocation: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
    // Spots bar
    spotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    spotsBarTrack: {
        flex: 1, height: 4, borderRadius: 2,
        backgroundColor: COLORS.surfaceRaised, overflow: 'hidden',
    },
    spotsBarFill: { height: '100%', borderRadius: 2, backgroundColor: COLORS.primary },
    avatarStack: { flexDirection: 'row', alignItems: 'center' },
    avatarWrap: { borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.surface },
    cardPlayerCount: { fontSize: 11, color: COLORS.textMuted },

    // Card actions
    cardAction: { alignItems: 'center', gap: 2, marginLeft: 8, paddingTop: 2, flexShrink: 0 },
    hostLabel: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
    fullLabel: { fontSize: 11, color: COLORS.textMuted },
    joinBtn: {
        backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
        paddingHorizontal: 14, paddingVertical: 6, minWidth: 52, alignItems: 'center',
    },
    joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

    // Shared sheet
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '94%', borderWidth: 1, borderColor: COLORS.borderStrong, borderBottomWidth: 0,
    },
    matchDetailSheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '94%' as any,
        minHeight: SCREEN_H * 0.52,
        width: '100%',
        borderWidth: 1,
        borderColor: COLORS.borderStrong,
        borderBottomWidth: 0,
    },
    sheetHandle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: COLORS.border, alignSelf: 'center', marginTop: 10,
    },
    sheetHead: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md,
    },
    sheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
    sheetSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
    sheetBody: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
    closeBtn: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: COLORS.surfaceRaised, justifyContent: 'center', alignItems: 'center',
    },

    // Detail modal specific
    detailTopBar: { height: 3, width: '100%' },
    detailHead: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: SPACING.sm,
    },
    detailHeadLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    detailIconWrap: {
        width: 54, height: 54, borderRadius: 27,
        backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primary + '30',
        justifyContent: 'center', alignItems: 'center',
    },
    detailSport: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },
    detailType: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
    hostRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md,
    },
    hostLabel2: { fontSize: 13, color: COLORS.textMuted },
    detailDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.md },

    // Info block (used for when/where and players)
    infoBlock: {
        backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.lg,
        borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
        marginHorizontal: SPACING.xl, marginBottom: SPACING.lg,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md },
    infoSep: { height: 1, backgroundColor: COLORS.border },
    infoLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 },
    infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },

    sectionTitle: {
        fontSize: 11, fontWeight: '800', color: COLORS.textMuted,
        letterSpacing: 0.8, textTransform: 'uppercase',
        paddingHorizontal: SPACING.xl, marginBottom: 8,
    },
    sectionDim: { fontWeight: '400', color: COLORS.textMuted },

    // Players in detail
    playerRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
    playerName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
    playerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
    playerTag: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
    openSlot: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
        justifyContent: 'center', alignItems: 'center',
    },

    // Description
    descText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, padding: SPACING.md },

    // Result trigger row
    resultRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.accentGlow, borderRadius: RADIUS.lg,
        borderWidth: 1, borderColor: COLORS.accent + '30',
        padding: SPACING.md, marginHorizontal: SPACING.xl, marginBottom: SPACING.lg,
    },
    resultLabel: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
    resultSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

    // Detail footer
    detailFooter: {
        padding: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    detailJoinBtn: {
        backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
        paddingVertical: 14, alignItems: 'center',
    },
    detailJoinBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    joinedState: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.pill, paddingVertical: 14,
        borderWidth: 1, borderColor: COLORS.primary + '40',
    },
    joinedStateText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    fullState: {
        backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.pill,
        paddingVertical: 14, alignItems: 'center',
    },
    fullStateText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },

    // Create form fields
    fieldLabel: {
        fontSize: 10, fontWeight: '800', color: COLORS.textMuted,
        letterSpacing: 1, marginBottom: 8, marginTop: SPACING.lg,
    },
    sportOpt: {
        alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceRaised, marginRight: 8, gap: 5,
    },
    sportOptActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
    sportOptLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

    typeRow: { gap: 8 },
    typeOpt: {
        flexDirection: 'row', alignItems: 'center',
        padding: SPACING.md, borderRadius: RADIUS.md,
        borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surfaceRaised,
    },
    typeOptActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
    typeOptTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    typeOptSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

    dateTimeRow: { flexDirection: 'row' },
    pickerBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.md,
        borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 12,
    },
    pickerBtnText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
    placeholder: { color: COLORS.textMuted },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.md,
        borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md,
    },
    input: { flex: 1, color: COLORS.text, fontSize: 14, paddingVertical: 11 },

    submitBtn: {
        backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
        paddingVertical: 14, alignItems: 'center',
        marginTop: SPACING.xl, ...SHADOWS.primaryGlow,
    },
    submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    // Submit result modal
    resultPlayerRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: SPACING.md, borderRadius: RADIUS.md,
        borderWidth: 1, borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceRaised, marginBottom: 8,
    },
    resultPlayerRowWin: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
    checkbox: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: COLORS.border,
        justifyContent: 'center', alignItems: 'center',
    },
    checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    resultName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
    winLabel: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
});
