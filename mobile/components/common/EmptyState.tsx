import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { LucideIcon } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    children?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: IconComponent,
    title,
    description,
    actionLabel,
    onAction,
    children,
    className,
}: EmptyStateProps) {
    return (
        <View className={cn('flex-1 items-center justify-center py-12', className)}>
            {IconComponent && (
                <Icon as={IconComponent} className="mb-4 size-12 text-muted-foreground" />
            )}

            <Text className="mb-2 text-center text-lg font-medium">{title}</Text>

            {description && (
                <Text className="mb-6 px-4 text-center text-muted-foreground">{description}</Text>
            )}

            {children}

            {actionLabel && onAction && (
                <Button onPress={onAction}>
                    <Text>{actionLabel}</Text>
                </Button>
            )}
        </View>
    );
}
