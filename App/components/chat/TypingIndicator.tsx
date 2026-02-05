import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../constants/colors';

interface TypingIndicatorProps {
    userName?: string;
}

export default function TypingIndicator({ userName }: TypingIndicatorProps) {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.delay(600 - delay),
                ])
            ).start();
        };

        animateDot(dot1, 0);
        animateDot(dot2, 200);
        animateDot(dot3, 400);
    }, []);

    const getTranslateY = (dot: Animated.Value) => ({
        transform: [
            {
                translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                }),
            },
        ],
    });

    return (
        <View style={styles.container}>
            <View style={styles.bubble}>
                <Text style={styles.text}>
                    {userName ? `${userName} is typing` : 'Typing'}
                </Text>
                <View style={styles.dotsContainer}>
                    <Animated.View style={[styles.dot, getTranslateY(dot1)]} />
                    <Animated.View style={[styles.dot, getTranslateY(dot2)]} />
                    <Animated.View style={[styles.dot, getTranslateY(dot3)]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    bubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginRight: 6,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.textMuted,
    },
});
