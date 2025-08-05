import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useTheme } from '../contexts/ThemeProvider';
import { useFavorites } from '../contexts/FavoritesProvider';

export default function AppSidebar(props) {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const { favorites } = useFavorites();
  const { navigation } = props;

  const menuItems = [
    { id: 'MainTabs', title: 'Home', icon: 'home', screen: 'MainTabs' },
    { id: 'Rankings', title: 'Area Rankings', icon: 'trending-up', screen: 'Rankings' },
    { id: 'Property', title: 'Property Insights', icon: 'business', screen: 'Property' },
    { id: 'Listings', title: 'Verified Listings', icon: 'location', screen: 'Listings' },
  ];

  const accountItems = [
    { id: 'Favorites', title: 'Favorites', icon: 'heart', screen: 'Favorites', badge: favorites.length },
    { id: 'Settings', title: 'Settings', icon: 'settings', screen: 'Settings' },
    { id: 'Profile', title: 'Profile', icon: 'person', screen: 'Profile' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      padding: spacing.lg,
      paddingTop: spacing.xl,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      width: 48,
      height: 48,
      backgroundColor: 'white',
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    logoIcon: {
      width: 24,
      height: 24,
      backgroundColor: colors.primary,
      borderRadius: 12,
    },
    headerText: {
      flex: 1,
    },
    appName: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: 'white',
    },
    appTagline: {
      fontSize: fontSize.sm,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.xs,
    },
    menuItemActive: {
      backgroundColor: colors.primary,
    },
    menuIcon: {
      width: 24,
      marginRight: spacing.md,
    },
    menuText: {
      fontSize: fontSize.md,
      color: colors.text,
      flex: 1,
    },
    menuTextActive: {
      color: 'white',
      fontWeight: '500',
    },
    badge: {
      backgroundColor: colors.error,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      minWidth: 20,
      alignItems: 'center',
    },
    badgeText: {
      fontSize: fontSize.xs,
      color: 'white',
      fontWeight: '600',
    },
    footer: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });

  const handleNavigation = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logo}>
              <View style={styles.logoIcon} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.appName}>KHI Safe</Text>
              <Text style={styles.appTagline}>Neighborhood Safety</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Navigation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Navigation</Text>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.screen)}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={colors.text}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            {accountItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.screen)}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={colors.text}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuText}>{item.title}</Text>
                {item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            KHI Safe v1.0.0{'\n'}
            Making Karachi Safer Together
          </Text>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}