import React from 'react';
import { Pressable, Text as RNText, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface Reaction {
    emoji: string;
    count: number;
    userReacted: boolean;
}

interface ReactionButtonProps {
    reaction: Reaction;
    onPress: () => void;
    disabled?: boolean;
}

export function ReactionButton({ reaction, onPress, disabled = false }: ReactionButtonProps) {
    const animatedValue = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(animatedValue, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(animatedValue, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
        }).start();
    };

    const handlePress = () => {
        if (!disabled) {
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onPress();
        }
    };

    return (
        <Animated.View
            style={{
                transform: [{ scale: animatedValue }],
            }}>
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                className={cn(
                    'flex-row items-center rounded-full border px-2 py-1',
                    reaction.userReacted
                        ? 'border-primary bg-primary/20'
                        : 'border-border bg-muted',
                    disabled && 'opacity-50'
                )}>
                <RNText className="mr-1 text-sm">{reaction.emoji}</RNText>
                <Text
                    className={cn(
                        'text-xs font-medium',
                        reaction.userReacted ? 'text-primary' : 'text-muted-foreground'
                    )}>
                    {reaction.count}
                </Text>
            </Pressable>
        </Animated.View>
    );
}
