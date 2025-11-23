import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

interface QuickActionGridProps {
  actions: QuickAction[];
}

export default function QuickActionGrid({ actions }: QuickActionGridProps) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          onPress={action.onPress}
          style={styles.actionCard}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{action.icon}</Text>
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    height: 96,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1f1f',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
