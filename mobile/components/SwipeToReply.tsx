import React, { useRef, useState } from 'react';
import { View, PanResponder, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/icon';
import { Reply } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface SwipeToReplyProps {
    children: React.ReactNode;
    onReply: () => void;
    disabled?: boolean;
    className?: string;
}

const SWIPE_THRESHOLD = 50;
const MAX_SWIPE = 80;

export function SwipeToReply({
    children,
    onReply,
    disabled = false,
    className,
}: SwipeToReplyProps) {
    const translateX = useRef(new Animated.Value(0)).current;
    const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return !disabled && gestureState.dx > 10 && Math.abs(gestureState.dy) < 50;
        },
        onPanResponderGrant: () => {
            setHasTriggeredHaptic(false);
        },
        onPanResponderMove: (_, gestureState) => {
            if (disabled) return;

            const swipeDistance = Math.max(0, Math.min(gestureState.dx, MAX_SWIPE));
            translateX.setValue(swipeDistance);

            if (swipeDistance >= SWIPE_THRESHOLD && !hasTriggeredHaptic) {
                setHasTriggeredHaptic(true);
                if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            if (disabled) return;

            const swipeDistance = Math.max(0, gestureState.dx);

            if (swipeDistance >= SWIPE_THRESHOLD) {
                onReply();
                if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
            }

            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                tension: 200,
                friction: 8,
            }).start();

            setHasTriggeredHaptic(false);
        },
    });

    const replyIconOpacity = translateX.interpolate({
        inputRange: [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
        outputRange: [0, 0.6, 1],
        extrapolate: 'clamp',
    });

    const replyIconScale = translateX.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0.5, 1],
        extrapolate: 'clamp',
    });

    if (disabled) {
        return <View className={className}>{children}</View>;
    }

    return (
        <View className={cn('relative', className)}>
            {/* Reply icon - positioned behind the message */}
            <View className="absolute inset-0 flex-row items-center justify-start pl-6">
                <Animated.View
                    style={{
                        opacity: replyIconOpacity,
                        transform: [{ scale: replyIconScale }],
                    }}>
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                        <Icon as={Reply} size={16} className="text-primary" />
                    </View>
                </Animated.View>
            </View>

            {/* Swipeable content */}
            <Animated.View
                {...panResponder.panHandlers}
                style={{
                    transform: [{ translateX }],
                }}>
                {children}
            </Animated.View>
        </View>
    );
}
