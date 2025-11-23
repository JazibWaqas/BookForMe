import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Card from '../../components/ui/Card';

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<'forum' | 'matches' | 'chats' | 'leaderboard'>('forum');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social Hub</Text>
        <Text style={styles.subtitle}>Connect with the community</Text>
      </View>

      <View style={styles.tabBar}>
        {(['forum', 'matches', 'chats', 'leaderboard'] as const).map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, index === 3 && styles.tabLast]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'forum' && (
          <View>
            <Text style={styles.sectionTitle}>Recent Posts</Text>
            {[1, 2, 3].map((i) => (
              <Card key={i} style={styles.forumCard}>
                <Text style={styles.forumTitle}>Looking for doubles partners</Text>
                <Text style={styles.forumMeta}>Posted 2h ago by @user{i}</Text>
                <Text style={styles.forumBody}>Anyone up for a game tomorrow evening at DHA courts?</Text>
              </Card>
            ))}
          </View>
        )}
        
        {activeTab === 'matches' && (
          <View>
            <Text style={styles.sectionTitle}>Open Matches</Text>
            {[1, 2].map((i) => (
              <Card key={i} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchTitle}>Padel Match</Text>
                  <Text style={styles.joinText}>Join</Text>
                </View>
                <Text style={styles.matchMeta}>Tomorrow • 6:00 PM • 2/4 players</Text>
              </Card>
            ))}
          </View>
        )}
        
        {activeTab === 'chats' && (
          <Text style={styles.emptyText}>No chats yet</Text>
        )}
        
        {activeTab === 'leaderboard' && (
          <View>
            <Text style={styles.sectionTitle}>Top Players</Text>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} style={styles.leaderboardCard}>
                <View style={styles.leaderboardRow}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.rank}>#{i}</Text>
                    <View>
                      <Text style={styles.playerName}>Player {i}</Text>
                      <Text style={styles.playerMatches}>{100 - i * 10} matches</Text>
                    </View>
                  </View>
                  <Text style={styles.points}>{500 - i * 50} pts</Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#4b5563',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#4b5563',
  },
  tabLast: {
    borderRightWidth: 0,
  },
  tabText: {
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'capitalize',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '600',
    marginBottom: 12,
  },
  forumCard: {
    marginBottom: 12,
  },
  forumTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 4,
  },
  forumMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  forumBody: {
    fontSize: 14,
    color: '#d1d5db',
  },
  matchCard: {
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  joinText: {
    fontSize: 12,
    color: '#4ade80',
  },
  matchMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 32,
  },
  leaderboardCard: {
    marginBottom: 12,
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
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  playerMatches: {
    fontSize: 12,
    color: '#6b7280',
  },
  points: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '600',
  },
});

