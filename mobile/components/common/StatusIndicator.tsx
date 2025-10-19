import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';

interface StatusIndicatorProps {
    status: 'online' | 'offline' | 'connecting' | 'error' | 'success' | 'warning';
    label?: string;
    showDot?: boolean;
    showBadge?: boolean;
    showIcon?: boolean;
    icon?: LucideIcon;
    size?: 'sm' | 'default' | 'lg';
    className?: string;
    dotClassName?: string;
    labelClassName?: string;
}

const statusConfig = {
    online: {
        color: 'bg-green-500',
        badgeVariant: 'success' as const,
        label: 'Online',
    },
    offline: {
        color: 'bg-red-500',
        badgeVariant: 'destructive' as const,
        label: 'Offline',
    },
    connecting: {
        color: 'bg-yellow-500',
        badgeVariant: 'warning' as const,
        label: 'Connecting',
    },
    error: {
        color: 'bg-red-500',
        badgeVariant: 'destructive' as const,
        label: 'Error',
    },
    success: {
        color: 'bg-green-500',
        badgeVariant: 'success' as const,
        label: 'Success',
    },
    warning: {
        color: 'bg-yellow-500',
        badgeVariant: 'warning' as const,
        label: 'Warning',
    },
};

const sizeConfig = {
    sm: {
        dot: 'h-1.5 w-1.5',
        text: 'text-xs',
        icon: 'size-3',
    },
    default: {
        dot: 'h-2 w-2',
        text: 'text-xs',
        icon: 'size-4',
    },
    lg: {
        dot: 'h-3 w-3',
        text: 'text-sm',
        icon: 'size-5',
    },
};

export function StatusIndicator({
    status,
    label,
    showDot = true,
    showBadge = false,
    showIcon = false,
    icon: IconComponent,
    size = 'default',
    className,
    dotClassName,
    labelClassName
}: StatusIndicatorProps) {
    const config = statusConfig[status];
    const sizeStyles = sizeConfig[size];
    const displayLabel = label || config.label;

    if (showBadge) {
        return (
            <Badge variant={config.badgeVariant} size={size} className={className}>
                {displayLabel}
            </Badge>
        );
    }

    return (
        <View className={cn('flex-row items-center', className)}>
            {showIcon && IconComponent && (
                <Icon
                    as={IconComponent}
                    className={cn(sizeStyles.icon, 'mr-2 text-muted-foreground')}
                />
            )}

            {showDot && (
                <View
                    className={cn(
                        'rounded-full mr-2',
                        config.color,
                        sizeStyles.dot,
                        dotClassName
                    )}
                />
            )}

            {displayLabel && (
                <Text
                    className={cn(
                        'text-muted-foreground',
                        sizeStyles.text,
                        labelClassName
                    )}>
                    {displayLabel}
                </Text>
            )}
        </View>
    );
}
