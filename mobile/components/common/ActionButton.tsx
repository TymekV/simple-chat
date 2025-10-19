import React from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import type { LucideIcon } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
    title: string;
    onPress: () => void;
    icon?: LucideIcon;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    disabled?: boolean;
    loading?: boolean;
    hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
    className?: string;
}

export function ActionButton({
    title,
    onPress,
    icon: IconComponent,
    variant = 'default',
    size = 'default',
    disabled = false,
    loading = false,
    hapticFeedback = 'light',
    className,
}: ActionButtonProps) {
    const handlePress = () => {
        if (disabled || loading) return;

        if (Platform.OS !== 'web' && hapticFeedback !== 'none') {
            const feedbackMap = {
                light: Haptics.ImpactFeedbackStyle.Light,
                medium: Haptics.ImpactFeedbackStyle.Medium,
                heavy: Haptics.ImpactFeedbackStyle.Heavy,
            };
            Haptics.impactAsync(feedbackMap[hapticFeedback]);
        }

        onPress();
    };

    return (
        <Button
            variant={variant}
            size={size}
            onPress={handlePress}
            disabled={disabled || loading}
            className={className}>
            {IconComponent && (
                <Icon as={IconComponent} className={cn(title ? 'mr-2' : '', 'size-4')} />
            )}
            {title && <Text>{loading ? 'Loading...' : title}</Text>}
        </Button>
    );
}
