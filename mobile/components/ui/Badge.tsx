import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
    size?: 'sm' | 'default' | 'lg';
    className?: string;
}

const badgeVariants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-border bg-transparent text-foreground',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-black',
};

const badgeSizes = {
    sm: 'px-2 py-0.5',
    default: 'px-2.5 py-0.5',
    lg: 'px-3 py-1',
};

const textSizes = {
    sm: 'text-xs',
    default: 'text-xs',
    lg: 'text-sm',
};

export function Badge({ children, variant = 'default', size = 'default', className }: BadgeProps) {
    return (
        <View
            className={cn(
                'inline-flex items-center rounded-full font-semibold transition-colors',
                badgeVariants[variant],
                badgeSizes[size],
                className
            )}>
            <Text className={cn('font-medium', textSizes[size])}>{children}</Text>
        </View>
    );
}
