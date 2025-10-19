import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Pressable, TextInput, Platform } from 'react-native';
import Animated, {
    withTiming,
    withSpring,
    useAnimatedStyle,
    useSharedValue,
    interpolate,
} from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';
import { Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface QuickSearchProps {
    searchText: string;
    onSearchChange: (text: string) => void;
    isActive: boolean;
    onToggle: () => void;
    placeholder?: string;
}

export function QuickSearch({
    searchText,
    onSearchChange,
    isActive,
    onToggle,
    placeholder = 'Search messages...',
}: QuickSearchProps) {
    const inputRef = useRef<TextInput>(null);
    const animatedWidth = useSharedValue(0);
    const opacity = useSharedValue(0);

    const handleToggle = useCallback(() => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onToggle();
    }, [onToggle]);

    const handleClear = useCallback(() => {
        onSearchChange('');
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [onSearchChange]);

    const handleClose = useCallback(() => {
        onSearchChange('');
        onToggle();
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [onSearchChange, onToggle]);

    useEffect(() => {
        if (isActive) {
            animatedWidth.value = withSpring(1, { damping: 15, stiffness: 120 });
            opacity.value = withTiming(1, { duration: 250 });
            setTimeout(() => {
                inputRef.current?.focus();

            }, 100);
        } else {
            animatedWidth.value = withTiming(0, { duration: 200 });
            opacity.value = withTiming(0, { duration: 150 });
            inputRef.current?.blur();
        }
    }, [isActive, animatedWidth, opacity]);

    const animatedInputStyle = useAnimatedStyle(() => {
        const width = interpolate(animatedWidth.value, [0, 1], [0, 200]);
        return {
            width: width,
            opacity: opacity.value,
        };
    });

    return (
        <View className="flex-row items-center">
            {isActive && (
                <Animated.View
                    style={[animatedInputStyle]}
                    className="mr-2 overflow-hidden rounded-md border border-border bg-background px-3 py-1">
                    <TextInput
                        ref={inputRef}
                        value={searchText}
                        onChangeText={onSearchChange}
                        placeholder={placeholder}
                        placeholderTextColor="rgb(115, 115, 115)" // text-muted-foreground equivalent
                        className="text-sm text-foreground"
                        style={{
                            fontSize: 14,
                            lineHeight: 20,
                            minHeight: 20,
                        }}
                        returnKeyType="search"
                        blurOnSubmit={false}
                        clearButtonMode="never" // We'll handle this with our own button
                    />
                </Animated.View>
            )}

            <View className="flex-row items-center">
                {isActive && searchText.length > 0 && (
                    <Pressable onPress={handleClear} className="mr-1 p-1">
                        <Icon as={X} size={16} className="text-muted-foreground" />
                    </Pressable>
                )}

                <Pressable onPress={isActive ? handleClose : handleToggle} className="p-1">
                    <Icon
                        as={Search}
                        size={20}
                        className={
                            isActive || searchText.length > 0
                                ? 'text-primary'
                                : 'text-muted-foreground'
                        }
                    />
                    {searchText.length > 0 && !isActive && (
                        <View className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                </Pressable>
            </View>
        </View>
    );
}
