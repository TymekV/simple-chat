import React, { useEffect, useState } from 'react';
import { View, Animated } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { TypingIndicator as TypingIndicatorType } from '@/types/server/TypingIndicator';

interface TypingIndicatorProps {
    typingUsers: TypingIndicatorType[];
    className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
    const [animatedValues] = useState(() => [
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]);

    useEffect(() => {
        if (typingUsers.length > 0) {
            const animations = animatedValues.map((value, index) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(index * 200),
                        Animated.timing(value, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(value, {
                            toValue: 0,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ])
                )
            );

            Animated.parallel(animations).start();

            return () => {
                animations.forEach((animation) => animation.stop());
                animatedValues.forEach((value) => value.setValue(0));
            };
        } else {
            animatedValues.forEach((value) => value.setValue(0));
        }
    }, [typingUsers.length, animatedValues]);

    if (typingUsers.length === 0) {
        return null;
    }

    const getTypingText = () => {
        if (typingUsers.length === 1) {
            const user = typingUsers[0];
            const displayName = user.username || `User ${user.user_id.slice(0, 8)}`;
            return `${displayName} is typing`;
        } else if (typingUsers.length === 2) {
            const user1 = typingUsers[0];
            const user2 = typingUsers[1];
            const name1 = user1.username || `User ${user1.user_id.slice(0, 8)}`;
            const name2 = user2.username || `User ${user2.user_id.slice(0, 8)}`;
            return `${name1} and ${name2} are typing`;
        } else {
            return `${typingUsers.length} people are typing`;
        }
    };

    return (
        <View className={cn('flex-row items-center px-4 py-2', className)}>
            <View className="flex-row items-center">
                {animatedValues.map((animatedValue, index) => (
                    <Animated.View
                        key={index}
                        className="mx-0.5 h-2 w-2 rounded-full bg-muted-foreground"
                        style={{
                            opacity: animatedValue,
                            transform: [
                                {
                                    scale: animatedValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.8, 1.2],
                                    }),
                                },
                            ],
                        }}
                    />
                ))}
            </View>
            <Text className="ml-3 text-sm italic text-muted-foreground">{getTypingText()}...</Text>
        </View>
    );
}
