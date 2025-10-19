import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

interface ScreenLayoutProps {
    children: React.ReactNode;
    title?: string;
    headerRight?: () => React.ReactNode;
    headerLeft?: () => React.ReactNode;
    scrollable?: boolean;
    keyboardAvoiding?: boolean;
    safeArea?: boolean;
    className?: string;
    contentClassName?: string;
    showsVerticalScrollIndicator?: boolean;
}

export function ScreenLayout({
    children,
    title,
    headerRight,
    headerLeft,
    scrollable = false,
    keyboardAvoiding = false,
    safeArea = true,
    className,
    contentClassName,
    showsVerticalScrollIndicator = false,
}: ScreenLayoutProps) {
    const screenOptions = {
        title,
        headerRight,
        headerLeft,
    };

    const content = scrollable ? (
        <ScrollView
            className={cn('flex-1', contentClassName)}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            keyboardShouldPersistTaps="handled">
            {children}
        </ScrollView>
    ) : (
        <View className={cn('flex-1', contentClassName)}>{children}</View>
    );

    const wrappedContent = keyboardAvoiding ? (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            style={{ flex: 1 }}>
            {content}
        </KeyboardAvoidingView>
    ) : (
        content
    );

    const Container = safeArea ? SafeAreaView : View;

    return (
        <Container className={cn('flex-1 bg-background', className)}>
            <Stack.Screen options={screenOptions} />
            {wrappedContent}
        </Container>
    );
}
