import React, { memo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { RoomEvent } from '@/types/server/RoomEvent';

interface SystemMessageProps {
    event: RoomEvent;
    className?: string;
}

export const SystemMessage = memo(function SystemMessage({
    event,
    className,
}: SystemMessageProps) {
    const getSystemMessage = () => {
        if ('UserJoin' in event.data) {
            const { username, user_id } = event.data.UserJoin;
            const displayName = username || `User ${String(user_id).slice(0, 8)}`;
            return `${displayName} joined the room`;
        }

        if ('UserLeave' in event.data) {
            const { username, user_id } = event.data.UserLeave;
            const displayName = username || `User ${String(user_id).slice(0, 8)}`;
            return `${displayName} left the room`;
        }

        return 'System event';
    };

    const timestamp = new Date(event.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <View className={cn('my-2 items-center', className)}>
            <View className="bg-muted/50 px-3 py-1 rounded-full">
                <Text className="text-xs text-muted-foreground text-center">
                    {getSystemMessage()} • {timestamp}
                </Text>
            </View>
        </View>
    );
});
