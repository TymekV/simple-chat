import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { RoomEvent } from '@/types/server/RoomEvent';

interface MessageBubbleProps {
    message: RoomEvent;
    isOwnMessage?: boolean;
    senderName?: string;
}

export function MessageBubble({ message, isOwnMessage = false, senderName }: MessageBubbleProps) {
    const messageContent = 'Message' in message.data ? message.data.Message.content : '';

    const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <View className={cn('mb-3 max-w-[80%]', isOwnMessage ? 'self-end' : 'self-start')}>
            {!isOwnMessage && senderName && (
                <Text className="mb-1 ml-3 text-xs text-muted-foreground">{senderName}</Text>
            )}

            <View
                className={cn(
                    'rounded-2xl px-4 py-2',
                    isOwnMessage ? 'rounded-br-md bg-primary' : 'rounded-bl-md bg-muted'
                )}>
                <Text
                    className={cn(
                        'text-sm leading-5',
                        isOwnMessage ? 'text-primary-foreground' : 'text-foreground'
                    )}>
                    {messageContent}
                </Text>
            </View>

            <Text
                className={cn(
                    'mt-1 text-xs text-muted-foreground',
                    isOwnMessage ? 'mr-3 text-right' : 'ml-3 text-left'
                )}>
                {timestamp}
            </Text>
        </View>
    );
}
