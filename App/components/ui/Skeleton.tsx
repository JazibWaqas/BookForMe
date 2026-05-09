import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { COLORS, RADIUS } from '../../constants/colors';

interface SkeletonProps {
  /** Width of the skeleton block. Number = px, string = percentage. */
  width?: ViewStyle['width'];
  /** Height of the skeleton block in px. */
  height?: number;
  /** Border radius — defaults to RADIUS.sm. */
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  /** Disable the shimmer animation (useful for testing). */
  animated?: boolean;
}

/**
 * Theme-aware shimmer placeholder. No native deps — pure Animated API.
 * Use as a building block for screen-specific skeleton layouts.
 */
export default function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = RADIUS.sm,
  style,
  animated = true,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, animated]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius } as ViewStyle,
        { opacity: animated ? opacity : 0.6 },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Wrap a set of Skeleton blocks in a labelled, screen-reader-friendly container. */
export function SkeletonGroup({ children, style }: SkeletonGroupProps) {
  return (
    <View
      style={style}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
      accessibilityState={{ busy: true }}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surfaceHighlight,
  },
});
