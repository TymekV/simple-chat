import React, { memo, useState, useEffect } from 'react';
import { View, Pressable, Platform, Alert, Modal, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Edit3, Trash2, X, Check } from 'lucide-react-native';
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
    onEditMessage?: (messageId: string, newContent: string) => void;
    onDeleteMessage?: (messageId: string) => void;
}

export const MessageGroup = memo(function MessageGroup({
    messages,
    isOwnMessage = false,
    senderName,
    onAddReaction,
    onRemoveReaction,
    getMessageReactions,
    onEditMessage,
    onDeleteMessage,
}: MessageGroupProps) {
    if (messages.length === 0) return null;

    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const timestamp = new Date(lastMessage.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    const handleLongPress = (messageId: string) => {
        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
        setShowReactionPicker(messageId);
    };

    const handleAddReaction = (messageId: string, emoji: string) => {
        onAddReaction?.(messageId, emoji);
        setShowReactionPicker(null);
    };

    const handleRemoveReaction = (messageId: string, emoji: string) => {
        onRemoveReaction?.(messageId, emoji);
    };

    const handleEditMessage = (messageId: string, currentContent: string) => {
        setEditingMessageId(messageId);
        setEditContent(currentContent);
    };

    const handleSaveEdit = () => {
        if (editingMessageId && editContent.trim()) {
            onEditMessage?.(editingMessageId, editContent.trim());
            setEditingMessageId(null);
            setEditContent('');
        }
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    const handleDeleteMessage = (messageId: string) => {
        Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => onDeleteMessage?.(messageId),
            },
        ]);
    };

    useEffect(() => {
        if (showReactionPicker) {
            const timer = setTimeout(() => {
                setShowReactionPicker(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showReactionPicker]);

    return (
        <>
            <View className={cn('mb-4 max-w-[80%]', isOwnMessage ? 'self-end' : 'self-start')}>
                {!isOwnMessage && senderName && (
                    <Text className="mb-2 ml-3 text-xs text-muted-foreground">{senderName}</Text>
                )}

                <View className="gap-1">
                    {messages.map((message, index) => {
                        const isFirst = index === 0;
                        const isLast = index === messages.length - 1;
                        const messageData = 'Message' in message.data ? message.data.Message : null;
                        const messageContent = messageData?.content || '';
                        const isDeleted = messageData?.deleted || false;
                        const isEdited = messageData?.edited || false;
                        const reactions = getMessageReactions?.(message.id) || [];
                        const isPickerOpen = showReactionPicker === message.id;

                        return (
                            <View key={message.id} className="group relative">
                                <Pressable
                                    onLongPress={() => handleLongPress(message.id)}
                                    delayLongPress={300}
                                    className={cn(
                                        'px-4 py-2',
                                        isOwnMessage ? 'bg-primary' : 'bg-muted',
                                        isDeleted && 'opacity-60',

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
                                            isOwnMessage
                                                ? 'text-primary-foreground'
                                                : 'text-foreground',
                                            isDeleted && 'italic text-muted-foreground'
                                        )}>
                                        {isDeleted ? 'This message was deleted' : messageContent}
                                    </Text>
                                    {isEdited && !isDeleted && (
                                        <Text
                                            className={cn(
                                                'mt-1 text-xs opacity-70',
                                                isOwnMessage
                                                    ? 'text-primary-foreground'
                                                    : 'text-muted-foreground'
                                            )}>
                                            (edited)
                                        </Text>
                                    )}
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
                                        onEditMessage={
                                            isOwnMessage && !isDeleted
                                                ? () =>
                                                      handleEditMessage(message.id, messageContent)
                                                : undefined
                                        }
                                        onDeleteMessage={
                                            isOwnMessage && !isDeleted
                                                ? () => handleDeleteMessage(message.id)
                                                : undefined
                                        }
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

            {/* Edit Modal */}
            <Modal visible={editingMessageId !== null} transparent={true} animationType="fade">
                <View className="flex-1 items-center justify-center bg-black/50 p-4">
                    <View className="w-full max-w-sm rounded-lg bg-background p-4">
                        <Text className="mb-4 text-lg font-semibold">Edit Message</Text>
                        <TextInput
                            value={editContent}
                            onChangeText={setEditContent}
                            multiline
                            className="mb-4 min-h-[80px] rounded-lg border border-border p-3 text-foreground"
                            placeholder="Edit your message..."
                            autoFocus
                            style={{ textAlignVertical: 'top' }}
                        />
                        <View className="flex-row justify-end gap-2">
                            <Button
                                variant="outline"
                                onPress={handleCancelEdit}
                                className="flex-row items-center gap-2">
                                <Icon as={X} size={16} />
                                <Text>Cancel</Text>
                            </Button>
                            <Button
                                onPress={handleSaveEdit}
                                disabled={!editContent.trim()}
                                className="flex-row items-center gap-2">
                                <Icon as={Check} size={16} />
                                <Text>Save</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
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
