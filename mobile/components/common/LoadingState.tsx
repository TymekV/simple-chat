import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
    message?: string;
    size?: 'small' | 'large';
    className?: string;
    showText?: boolean;
}

export function LoadingState({
    message = 'Loading...',
    size = 'large',
    className,
    showText = true,
}: LoadingStateProps) {
    return (
        <View className={cn('flex-1 items-center justify-center py-12', className)}>
            <ActivityIndicator size={size} className="mb-4" />
            {showText && <Text className="text-center text-muted-foreground">{message}</Text>}
        </View>
    );
}
