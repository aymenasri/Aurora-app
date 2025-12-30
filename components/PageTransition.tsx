import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface PageTransitionProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export default function PageTransition({ children, style }: PageTransitionProps) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50); // Start from lower down

    useFocusEffect(
        useCallback(() => {
            // RESET values instantly when screen gets focus to prepare animation
            opacity.value = 0;
            translateY.value = 30;

            // ANIMATE to final state
            opacity.value = withTiming(1, { duration: 400 });
            translateY.value = withSpring(0, {
                damping: 15,
                stiffness: 90,
                mass: 0.8
            });

            return () => {
                // Optional: Animate out on blur if desired, but typically we just want animate IN
            };
        }, [])
    );

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>
            {children}
        </Animated.View>
    );
}
