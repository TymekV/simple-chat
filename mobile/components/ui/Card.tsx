import React from 'react';
import { View, Pressable } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onPress?: () => void;
    disabled?: boolean;
}

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

function Card({ children, className, onPress, disabled = false }: CardProps) {
    const Component = onPress ? Pressable : View;

    return (
        <Component
            onPress={onPress}
            disabled={disabled}
            className={cn(
                'rounded-lg border border-border bg-card shadow-sm',
                disabled && 'opacity-50',
                className
            )}>
            {children}
        </Component>
    );
}

function CardHeader({ children, className }: CardHeaderProps) {
    return (
        <View className={cn('flex flex-col space-y-1.5 p-6', className)}>
            {children}
        </View>
    );
}

function CardContent({ children, className }: CardContentProps) {
    return (
        <View className={cn('p-6 pt-0', className)}>
            {children}
        </View>
    );
}

function CardFooter({ children, className }: CardFooterProps) {
    return (
        <View className={cn('flex items-center p-6 pt-0', className)}>
            {children}
        </View>
    );
}

export { Card, CardHeader, CardContent, CardFooter };
