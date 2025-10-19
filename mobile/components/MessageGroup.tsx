import React, { memo, useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { MessageReactions } from '@/components/MessageReactions';
import type { RoomEvent } from '@/types/server/RoomEvent';

interface Reaction {
    emoji: string;
    count: number;
    userReacted: boolean;
}

interface MessageGroupProps {
    messages: RoomEvent[];
    isOwnMessage?: boolean;
    senderName?: string;
    onAddReaction?: (messageId: string, emoji: string) => void;
    onRemoveReaction?: (messageId: string, emoji: string) => void;
    getMessageReactions?: (messageId: string) => Reaction[];
}

export const MessageGroup = memo(function MessageGroup({
    messages,
    isOwnMessage = false,
    senderName,
    onAddReaction,
    onRemoveReaction,
    getMessageReactions,
}: MessageGroupProps) {
    if (messages.length === 0) return null;

    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

    console.log('MessageGroup DEBUG:', {
        senderName,
        isOwnMessage,
        senderId: firstMessage.from,
        messageCount: messages.length,
    });

    const timestamp = new Date(lastMessage.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    const handleLongPress = (messageId: string) => {
        setShowReactionPicker(messageId);
    };

    const handleAddReaction = (messageId: string, emoji: string) => {
        onAddReaction?.(messageId, emoji);
        setShowReactionPicker(null);
    };

    const handleRemoveReaction = (messageId: string, emoji: string) => {
        onRemoveReaction?.(messageId, emoji);
    };

    // Close reaction picker when touching outside
    useEffect(() => {
        if (showReactionPicker) {
            const timer = setTimeout(() => {
                setShowReactionPicker(null);
            }, 5000); // Auto close after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [showReactionPicker]);

    return (
        <View className={cn('mb-4 max-w-[80%]', isOwnMessage ? 'self-end' : 'self-start')}>
            {!isOwnMessage && senderName && (
                <Text className="mb-2 ml-3 text-xs text-muted-foreground">{senderName}</Text>
            )}

            <View className="gap-1">
                {messages.map((message, index) => {
                    const isFirst = index === 0;
                    const isLast = index === messages.length - 1;
                    const messageContent =
                        'Message' in message.data ? message.data.Message.content : '';
                    const reactions = getMessageReactions?.(message.id) || [];
                    const isPickerOpen = showReactionPicker === message.id;

                    return (
                        <View key={message.id} className="group">
                            <Pressable
                                onLongPress={() => handleLongPress(message.id)}
                                delayLongPress={300}
                                className={cn(
                                    'px-4 py-2',
                                    isOwnMessage ? 'bg-primary' : 'bg-muted',

                                    isFirst && isLast
                                        ? 'rounded-2xl'
                                        : isFirst
                                          ? isOwnMessage
                                              ? 'rounded-t-2xl rounded-bl-2xl rounded-br-md'
                                              : 'rounded-t-2xl rounded-bl-md rounded-br-2xl'
                                          : isLast
                                            ? isOwnMessage
                                                ? 'rounded-b-2xl rounded-bl-2xl rounded-tr-md'
                                                : 'rounded-b-2xl rounded-br-2xl rounded-tl-md'
                                            : isOwnMessage
                                              ? 'rounded-l-2xl rounded-tr-md'
                                              : 'rounded-r-2xl rounded-tl-md'
                                )}>
                                <Text
                                    className={cn(
                                        'text-sm leading-5',
                                        isOwnMessage ? 'text-primary-foreground' : 'text-foreground'
                                    )}>
                                    {messageContent}
                                </Text>
                            </Pressable>

                            {(reactions.length > 0 || isPickerOpen) && (
                                <MessageReactions
                                    messageId={message.id}
                                    reactions={reactions}
                                    onAddReaction={handleAddReaction}
                                    onRemoveReaction={handleRemoveReaction}
                                    showPicker={isPickerOpen}
                                    onClosePicker={() => setShowReactionPicker(null)}
                                    isOwnMessage={isOwnMessage}
                                    className={cn(
                                        'mt-1',
                                        isOwnMessage ? 'mr-2 self-end' : 'ml-2 self-start'
                                    )}
                                />
                            )}
                        </View>
                    );
                })}
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
});

export function groupMessages(
    messages: RoomEvent[],
    currentUserId: string,
    maxGroupTimeSpan = 5 * 60 * 1000
): Array<{
    messages: RoomEvent[];
    senderId: string;
    isOwnMessage: boolean;
}> {
    if (messages.length === 0) return [];

    const groups: Array<{
        messages: RoomEvent[];
        senderId: string;
        isOwnMessage: boolean;
    }> = [];

    let currentGroup: RoomEvent[] = [messages[0]];
    let currentSenderId = String(messages[0].from);

    console.log('groupMessages DEBUG:', {
        currentUserId,
        totalMessages: messages.length,
        firstMessageSender: currentSenderId,
        isFirstMessageOwn: currentSenderId === currentUserId,
    });

    for (let i = 1; i < messages.length; i++) {
        const message = messages[i];
        const messageTime = new Date(message.timestamp).getTime();
        const lastMessageTime = new Date(currentGroup[currentGroup.length - 1].timestamp).getTime();
        const timeDiff = messageTime - lastMessageTime;
        const messageSenderId = String(message.from);

        if (messageSenderId === currentSenderId && timeDiff <= maxGroupTimeSpan) {
            currentGroup.push(message);
        } else {
            groups.push({
                messages: [...currentGroup],
                senderId: currentSenderId,
                isOwnMessage: currentSenderId === currentUserId,
            });

            currentGroup = [message];
            currentSenderId = messageSenderId;
        }
    }

    groups.push({
        messages: currentGroup,
        senderId: currentSenderId,
        isOwnMessage: currentSenderId === currentUserId,
    });

    return groups;
}
