import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface AnimatableTabIconProps {
    focused: boolean;
    name: keyof typeof Ionicons.glyphMap;
    color: string;
    size: number;
}

export default function AnimatableTabIcon({ focused, name, color, size }: AnimatableTabIconProps) {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (focused) {
            scale.value = withSpring(1.2, { damping: 10, stiffness: 100 });
        } else {
            scale.value = withSpring(1, { damping: 10, stiffness: 100 });
        }
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={name} size={size} color={color} />
        </Animated.View>
    );
}
