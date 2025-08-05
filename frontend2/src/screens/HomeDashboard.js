import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeProvider';
import Header from '../components/Header';

const { width } = Dimensions.get('window');

export default function HomeDashboard() {
  const { colors, spacing, fontSize, borderRadius } = useTheme();

  const crimeAlerts = [
    {
      id: 1,
      type: 'theft',
      location: 'DHA Phase 5, Block L',
      time: '2 hours ago',
      severity: 'medium',
      description: 'Mobile phone snatching reported',
    },
    {
      id: 2,
      type: 'accident',
      location: 'Shahrah-e-Faisal',
      time: '4 hours ago',
      severity: 'high',
      description: 'Traffic accident near KDA Chowrangi',
    },
  ];

  const safetyTips = [
    'Avoid displaying expensive items in public',
    'Stay in well-lit areas during night hours',
    'Keep emergency contacts readily available',
    'Use official transportation services',
  ];

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return colors.textMuted;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
    },
    welcomeCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    welcomeTitle: {
      fontSize: fontSize.xl,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    welcomeSubtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statNumber: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
    },
    sectionSubtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    alertItem: {
      flexDirection: 'row',
      padding: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 4,
    },
    alertContent: {
      flex: 1,
      marginLeft: spacing.sm,
    },
    alertLocation: {
      fontSize: fontSize.md,
      fontWeight: '500',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    alertDescription: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    alertTime: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    tipText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
      flex: 1,
    },
    quickActionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    quickActionButton: {
      width: (width - spacing.md * 3) / 2,
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    quickActionText: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Dashboard" />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to KHI Safe</Text>
          <Text style={styles.welcomeSubtitle}>
            Stay informed about your neighborhood safety
          </Text>
        </View>

        {/* Safety Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.success }]}>87%</Text>
            <Text style={styles.statLabel}>Safety Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>142</Text>
            <Text style={styles.statLabel}>Community Members</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>8</Text>
            <Text style={styles.statLabel}>Active Alerts</Text>
          </View>
        </View>

        {/* Crime Alerts */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="warning" size={20} color="#EF4444" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Recent Alerts</Text>
              <Text style={styles.sectionSubtitle}>Latest safety updates in your area</Text>
            </View>
          </View>
          
          {crimeAlerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertItem,
                { borderLeftColor: getAlertColor(alert.severity) }
              ]}
            >
              <Ionicons
                name={alert.type === 'theft' ? 'warning' : 'car'}
                size={20}
                color={getAlertColor(alert.severity)}
              />
              <View style={styles.alertContent}>
                <Text style={styles.alertLocation}>{alert.location}</Text>
                <Text style={styles.alertDescription}>{alert.description}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Safety Tips */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Safety Tips</Text>
              <Text style={styles.sectionSubtitle}>Stay safe with these recommendations</Text>
            </View>
          </View>
          
          {safetyTips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="flash" size={20} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <Text style={styles.sectionSubtitle}>Emergency services and reports</Text>
            </View>
          </View>
          
          <View style={styles.quickActionGrid}>
            <TouchableOpacity style={styles.quickActionButton}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="call" size={24} color="#EF4444" />
              </View>
              <Text style={styles.quickActionText}>Emergency Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>Report Incident</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="location" size={24} color="#10B981" />
              </View>
              <Text style={styles.quickActionText}>Find Services</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="people" size={24} color="#6366F1" />
              </View>
              <Text style={styles.quickActionText}>Community</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}