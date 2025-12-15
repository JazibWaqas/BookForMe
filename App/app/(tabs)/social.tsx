import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';

export default function SocialScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'forum' | 'matches' | 'chats' | 'leaderboard'>('forum');
  const [searchQuery, setSearchQuery] = useState('');
  const [postText, setPostText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const posts = [
    {
      id: '1',
      author: 'Ahmed Khan',
      avatar: 'https://i.pravatar.cc/150?img=12',
      time: '2h ago',
      content: 'Looking for doubles partners for tomorrow evening at DHA courts. Anyone interested? 🎾',
      likes: 12,
      comments: 5,
      liked: false
    },
    {
      id: '2',
      author: 'Sara Ali',
      avatar: 'https://i.pravatar.cc/150?img=5',
      time: '5h ago',
      content: 'Just finished an amazing match at Courtside! The new courts are fantastic. Highly recommend! 🔥',
      likes: 24,
      comments: 8,
      liked: true
    },
    {
      id: '3',
      author: 'Bilal Shah',
      avatar: 'https://i.pravatar.cc/150?img=33',
      time: '1d ago',
      content: 'Tips for improving backhand? Been struggling lately... Any coaches available?',
      likes: 18,
      comments: 12,
      liked: false
    },
  ];

  const matches = [
    { id: '1', sport: 'Padel', type: 'casual', date: 'Tomorrow', time: '6:00 PM', location: 'DHA Courts', players: 2, maxPlayers: 4, host: 'Ahmed', hostAvatar: 'https://i.pravatar.cc/150?img=12' },
    { id: '2', sport: 'Tennis', type: 'ranked', date: 'Dec 1', time: '8:00 AM', location: 'Courtside', players: 3, maxPlayers: 4, host: 'Sara', hostAvatar: 'https://i.pravatar.cc/150?img=5' },
    { id: '3', sport: 'Badminton', type: 'casual', date: 'Dec 2', time: '7:00 PM', location: 'Sports Arena', players: 1, maxPlayers: 2, host: 'Bilal', hostAvatar: 'https://i.pravatar.cc/150?img=33' },
  ];

  const chats = [
    { id: '1', name: 'Ahmed Khan', avatar: 'https://i.pravatar.cc/150?img=12', lastMessage: 'See you tomorrow!', time: '10m', unread: 2, online: true },
    { id: '2', name: 'Padel Squad', avatar: 'https://i.pravatar.cc/150?img=68', lastMessage: 'Who\'s in for Saturday?', time: '1h', unread: 5, online: false },
    { id: '3', name: 'Sara Ali', avatar: 'https://i.pravatar.cc/150?img=5', lastMessage: 'Thanks for the game!', time: '2h', unread: 0, online: true },
    { id: '4', name: 'Tennis Club', avatar: 'https://i.pravatar.cc/150?img=70', lastMessage: 'New tournament announced!', time: '3h', unread: 1, online: false },
  ];

  const leaderboard = [
    { rank: 1, name: 'Hassan Raza', avatar: 'https://i.pravatar.cc/150?img=60', matches: 120, points: 2450, sport: 'Padel', winRate: 78 },
    { rank: 2, name: 'Fatima Malik', avatar: 'https://i.pravatar.cc/150?img=47', matches: 98, points: 2280, sport: 'Tennis', winRate: 72 },
    { rank: 3, name: 'Ali Ahmed', avatar: 'https://i.pravatar.cc/150?img=15', matches: 85, points: 2100, sport: 'Badminton', winRate: 68 },
    { rank: 4, name: 'Zainab Khan', avatar: 'https://i.pravatar.cc/150?img=32', matches: 76, points: 1950, sport: 'Padel', winRate: 65 },
    { rank: 5, name: 'Omar Shah', avatar: 'https://i.pravatar.cc/150?img=51', matches: 64, points: 1820, sport: 'Tennis', winRate: 61 },
  ];

  const tabs = [
    { id: 'forum', label: 'Forum', icon: 'newspaper-outline' },
    { id: 'matches', label: 'Matches', icon: 'tennisball-outline' },
    { id: 'chats', label: 'Chats', icon: 'chatbubbles-outline' },
    { id: 'leaderboard', label: 'Ranking', icon: 'trophy-outline' },
  ];

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <Text style={styles.title}>Social Hub</Text>
          <Text style={styles.subtitle}>Connect • Compete • Conquer</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? COLORS.textDark : COLORS.textMuted}
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* FORUM TAB */}
        {activeTab === 'forum' && (
          <View>
            {/* Create Post Card */}
            <Card style={styles.createPostCard}>
              <View style={styles.createPostHeader}>
                <Image source={{ uri: 'https://i.pravatar.cc/150?img=68' }} style={styles.userAvatar} />
                <TextInput
                  style={styles.postInput}
                  placeholder="What's on your mind?"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  value={postText}
                  onChangeText={setPostText}
                />
              </View>
              <View style={styles.createPostActions}>
                <TouchableOpacity style={styles.postActionButton}>
                  <Ionicons name="image-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.postActionText}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postActionButton}>
                  <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.postActionText}>Location</Text>
                </TouchableOpacity>
                <Button title="Post" variant="secondary" style={styles.postButton} onPress={() => { }} />
              </View>
            </Card>

            {/* Posts Feed */}
            {posts.map((post) => (
              <Card key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.authorInfo}>
                    <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
                    <View>
                      <Text style={styles.authorName}>{post.author}</Text>
                      <Text style={styles.postTime}>{post.time}</Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>

                <View style={styles.postStats}>
                  <Text style={styles.statsText}>{post.likes} likes</Text>
                  <Text style={styles.statsText}>{post.comments} comments</Text>
                </View>

                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons
                      name={post.liked ? "heart" : "heart-outline"}
                      size={20}
                      color={post.liked ? COLORS.error : COLORS.textMuted}
                    />
                    <Text style={[styles.actionText, post.liked && styles.actionTextLiked]}>
                      Like
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={20} color={COLORS.textMuted} />
                    <Text style={styles.actionText}>Comment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-social-outline" size={20} color={COLORS.textMuted} />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <View>
            {/* Search & Create */}
            <View style={styles.matchHeader}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search matches..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity style={styles.createMatchButton}>
                <Ionicons name="add" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
              {['all', 'casual', 'ranked', 'today', 'tomorrow'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Matches */}
            {matches.map((match) => (
              <TouchableOpacity key={match.id} activeOpacity={0.8}>
                <Card style={styles.matchCard}>
                  <View style={styles.matchCardHeader}>
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchSport}>{match.sport}</Text>
                      <View style={[styles.typeBadge, match.type === 'ranked' && styles.typeBadgeRanked]}>
                        <Text style={styles.typeText}>{match.type.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.playersIndicator}>
                      <Ionicons name="people" size={14} color={COLORS.textDark} style={{ marginRight: 4 }} />
                      <Text style={styles.playersText}>{match.players}/{match.maxPlayers}</Text>
                    </View>
                  </View>

                  <View style={styles.matchDetails}>
                    <View style={styles.matchDetailRow}>
                      <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.matchDetailText}>{match.date} • {match.time}</Text>
                    </View>
                    <View style={styles.matchDetailRow}>
                      <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.matchDetailText}>{match.location}</Text>
                    </View>
                  </View>

                  <View style={styles.matchFooter}>
                    <View style={styles.hostInfo}>
                      <Image source={{ uri: match.hostAvatar }} style={styles.hostAvatar} />
                      <Text style={styles.hostText}>Host: {match.host}</Text>
                    </View>
                    <TouchableOpacity style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>Join Match</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CHATS TAB */}
        {activeTab === 'chats' && (
          <View>
            {/* Search */}
            <View style={[styles.searchContainer, { marginBottom: 16 }]}>
              <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search messages..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Chats */}
            {chats.map((chat) => (
              <TouchableOpacity key={chat.id} style={styles.chatCard} activeOpacity={0.7}>
                <View style={styles.chatAvatarContainer}>
                  <Image source={{ uri: chat.avatar }} style={styles.chatAvatar} />
                  {chat.online && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{chat.name}</Text>
                    <Text style={styles.chatTime}>{chat.time}</Text>
                  </View>
                  <View style={styles.chatMessageRow}>
                    <Text style={[styles.chatMessage, chat.unread > 0 && styles.chatMessageUnread]} numberOfLines={1}>
                      {chat.lastMessage}
                    </Text>
                    {chat.unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{chat.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <View>
            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
              {['All Sports', 'Padel', 'Tennis', 'Badminton'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Top 3 Podium */}
            <View style={styles.podium}>
              <View style={styles.podiumItem}>
                <Image source={{ uri: leaderboard[1].avatar }} style={styles.podiumAvatar} />
                <View style={styles.podiumRank2}>
                  <Text style={styles.podiumRankText}>2</Text>
                </View>
                <Text style={styles.podiumName}>{leaderboard[1].name.split(' ')[0]}</Text>
                <Text style={styles.podiumPoints}>{leaderboard[1].points}</Text>
              </View>

              <View style={[styles.podiumItem, styles.podiumWinner]}>
                <Ionicons name="trophy" size={32} color="#FFD700" style={{ marginBottom: 8 }} />
                <Image source={{ uri: leaderboard[0].avatar }} style={styles.podiumAvatarLarge} />
                <View style={styles.podiumRank1}>
                  <Text style={styles.podiumRankText}>1</Text>
                </View>
                <Text style={styles.podiumName}>{leaderboard[0].name.split(' ')[0]}</Text>
                <Text style={styles.podiumPoints}>{leaderboard[0].points}</Text>
              </View>

              <View style={styles.podiumItem}>
                <Image source={{ uri: leaderboard[2].avatar }} style={styles.podiumAvatar} />
                <View style={styles.podiumRank3}>
                  <Text style={styles.podiumRankText}>3</Text>
                </View>
                <Text style={styles.podiumName}>{leaderboard[2].name.split(' ')[0]}</Text>
                <Text style={styles.podiumPoints}>{leaderboard[2].points}</Text>
              </View>
            </View>

            {/* Rest of Leaderboard */}
            {leaderboard.slice(3).map((player) => (
              <Card key={player.rank} style={styles.leaderboardCard}>
                <View style={styles.leaderboardRow}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.rankNumber}>#{player.rank}</Text>
                    <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
                    <View>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerStats}>
                        {player.matches} matches • {player.winRate}% win rate
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pointsContainer}>
                    <Text style={styles.points}>{player.points}</Text>
                    <Text style={styles.pointsLabel}>pts</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerGradient: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textDark,
    opacity: 0.9,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 11,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.textDark,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  createPostCard: {
    marginBottom: 16,
    padding: 16,
  },
  createPostHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 40,
  },
  createPostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  postActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  postButton: {
    paddingHorizontal: 24,
    height: 36,
  },
  postCard: {
    marginBottom: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  actionTextLiked: {
    color: COLORS.error,
  },
  matchHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    height: '100%',
  },
  createMatchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersScroll: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: COLORS.textDark,
  },
  matchCard: {
    marginBottom: 16,
    padding: 16,
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchSport: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  typeBadgeRanked: {
    backgroundColor: COLORS.warning,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  playersIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  playersText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  matchDetails: {
    gap: 8,
    marginBottom: 12,
  },
  matchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchDetailText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  hostText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatAvatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chatMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatMessage: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },
  chatMessageUnread: {
    fontWeight: '600',
    color: COLORS.text,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 24,
    gap: 12,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumWinner: {
    marginBottom: 20,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  podiumAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  podiumRank1: {
    backgroundColor: '#FFD700',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  podiumRank2: {
    backgroundColor: '#C0C0C0',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  podiumRank3: {
    backgroundColor: '#CD7F32',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  podiumRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  podiumPoints: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  leaderboardCard: {
    marginBottom: 12,
    padding: 16,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
    width: 30,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  playerStats: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pointsLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
