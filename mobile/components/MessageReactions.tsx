import React, { useState } from 'react';
import { View, Pressable, Text as RNText, Platform, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Plus, Edit3, Trash2, Reply, Star } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { ReactionButton } from '@/components/ReactionButton';

interface Reaction {
    emoji: string;
    count: number;
    userReacted: boolean;
}

interface MessageReactionsProps {
    messageId: string;
    reactions?: Reaction[];
    onAddReaction?: (messageId: string, emoji: string) => void;
    onRemoveReaction?: (messageId: string, emoji: string) => void;
    showPicker?: boolean;
    onClosePicker?: () => void;
    className?: string;
    isOwnMessage?: boolean;
    onEditMessage?: () => void;
    onDeleteMessage?: () => void;
    onReplyMessage?: () => void;
    onStarMessage?: () => void;
    onUnstarMessage?: () => void;
    isStarred?: boolean;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function MessageReactions({
    messageId,
    reactions = [],
    onAddReaction,
    onRemoveReaction,
    showPicker = false,
    onClosePicker,
    className,
    isOwnMessage = false,
    onEditMessage,
    onDeleteMessage,
    onReplyMessage,
    onStarMessage,
    onUnstarMessage,
    isStarred = false,
}: MessageReactionsProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleReactionPress = (emoji: string, userReacted: boolean) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        if (userReacted) {
            onRemoveReaction?.(messageId, emoji);
        } else {
            onAddReaction?.(messageId, emoji);
        }

        if (showEmojiPicker) {
            setShowEmojiPicker(false);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        onAddReaction?.(messageId, emoji);
        setShowEmojiPicker(false);
        onClosePicker?.();
    };

    const closeMenu = () => {
        setShowEmojiPicker(false);
        onClosePicker?.();
    };

    const hasEditDeleteOptions = onEditMessage || onDeleteMessage;
    const hasReplyOption = onReplyMessage;
    const hasStarOption = onStarMessage || onUnstarMessage;
    const hasActions = hasEditDeleteOptions || hasReplyOption || hasStarOption;

    const isMenuVisible = showEmojiPicker || showPicker;

    return (
        <>
            <View className={cn('mt-1 flex-row items-center gap-1', className)}>
                {reactions.map((reaction) => (
                    <ReactionButton
                        key={reaction.emoji}
                        reaction={reaction}
                        onPress={() => handleReactionPress(reaction.emoji, reaction.userReacted)}
                    />
                ))}

                <Pressable
                    onPress={() => {
                        if (Platform.OS !== 'web') {
                            Haptics.selectionAsync();
                        }
                        setShowEmojiPicker(true);
                    }}
                    className="ml-1 h-6 w-6 items-center justify-center rounded-full bg-muted/50">
                    <Icon as={Plus} size={12} className="text-muted-foreground" />
                </Pressable>
            </View>

            <Modal visible={isMenuVisible} transparent animationType="fade">
                <Pressable
                    className="flex-1 bg-black/30"
                    onPress={closeMenu}
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                    }}>
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-xl border border-border bg-background"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.25,
                            shadowRadius: 12,
                            elevation: 12,
                        }}>
                        <View className="border-b border-border px-4 py-3">
                            <Text className="text-center text-sm font-medium text-muted-foreground">
                                Message Actions
                            </Text>
                        </View>

                        <View className="px-4 py-4">
                            <Text className="mb-3 text-xs font-medium text-muted-foreground">
                                QUICK REACTIONS
                            </Text>
                            <View className="flex-row flex-wrap items-center justify-between gap-2">
                                {COMMON_EMOJIS.map((emoji) => (
                                    <Pressable
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            handleEmojiSelect(emoji);
                                        }}
                                        className="h-12 w-12 items-center justify-center rounded-xl bg-muted/30 active:scale-95 active:bg-muted"
                                        accessibilityRole="button"
                                        accessibilityLabel={`React with ${emoji}`}>
                                        <RNText className="text-2xl">{emoji}</RNText>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {hasActions && (
                            <>
                                <View className="mx-4 h-px bg-border" />
                                <View className="px-4 pb-4 pt-2">
                                    {onReplyMessage && (
                                        <Pressable
                                            onPress={() => {
                                                if (Platform.OS !== 'web') {
                                                    Haptics.impactAsync(
                                                        Haptics.ImpactFeedbackStyle.Medium
                                                    );
                                                }
                                                onReplyMessage();
                                                closeMenu();
                                            }}
                                            className="mb-2 flex-row items-center gap-4 rounded-xl bg-muted/30 px-4 py-4 active:bg-muted"
                                            accessibilityRole="button"
                                            accessibilityLabel="Reply to this message">
                                            <View className="h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                <Icon
                                                    as={Reply}
                                                    size={16}
                                                    className="text-blue-600 dark:text-blue-400"
                                                />
                                            </View>
                                            <Text className="font-medium">Reply to message</Text>
                                        </Pressable>
                                    )}
                                    {(onStarMessage || onUnstarMessage) && (
                                        <Pressable
                                            onPress={() => {
                                                if (Platform.OS !== 'web') {
                                                    Haptics.impactAsync(
                                                        Haptics.ImpactFeedbackStyle.Medium
                                                    );
                                                }
                                                if (isStarred) {
                                                    onUnstarMessage?.();
                                                } else {
                                                    onStarMessage?.();
                                                }
                                                closeMenu();
                                            }}
                                            className="mb-2 flex-row items-center gap-4 rounded-xl bg-muted/30 px-4 py-4 active:bg-muted"
                                            accessibilityRole="button"
                                            accessibilityLabel={
                                                isStarred
                                                    ? 'Remove from starred messages'
                                                    : 'Add to starred messages'
                                            }>
                                            <View
                                                className={cn(
                                                    'h-8 w-8 items-center justify-center rounded-lg',
                                                    isStarred
                                                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                                        : 'bg-gray-100 dark:bg-gray-800'
                                                )}>
                                                <Icon
                                                    as={Star}
                                                    size={16}
                                                    className={
                                                        isStarred
                                                            ? 'text-yellow-600 dark:text-yellow-400'
                                                            : 'text-gray-600 dark:text-gray-400'
                                                    }
                                                    fill={isStarred ? 'currentColor' : 'none'}
                                                />
                                            </View>
                                            <Text className="font-medium">
                                                {isStarred
                                                    ? 'Remove from starred'
                                                    : 'Add to starred'}
                                            </Text>
                                        </Pressable>
                                    )}
                                    {onEditMessage && (
                                        <Pressable
                                            onPress={() => {
                                                if (Platform.OS !== 'web') {
                                                    Haptics.impactAsync(
                                                        Haptics.ImpactFeedbackStyle.Medium
                                                    );
                                                }
                                                onEditMessage();
                                                closeMenu();
                                            }}
                                            className="mb-2 flex-row items-center gap-4 rounded-xl bg-muted/30 px-4 py-4 active:bg-muted"
                                            accessibilityRole="button"
                                            accessibilityLabel="Edit this message">
                                            <View className="h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                                <Icon
                                                    as={Edit3}
                                                    size={16}
                                                    className="text-green-600 dark:text-green-400"
                                                />
                                            </View>
                                            <Text className="font-medium">Edit message</Text>
                                        </Pressable>
                                    )}
                                    {onDeleteMessage && (
                                        <Pressable
                                            onPress={() => {
                                                if (Platform.OS !== 'web') {
                                                    Haptics.notificationAsync(
                                                        Haptics.NotificationFeedbackType.Warning
                                                    );
                                                }
                                                onDeleteMessage();
                                                closeMenu();
                                            }}
                                            className="flex-row items-center gap-4 rounded-xl bg-muted/30 px-4 py-4 active:bg-muted"
                                            accessibilityRole="button"
                                            accessibilityLabel="Delete this message">
                                            <View className="h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                                                <Icon
                                                    as={Trash2}
                                                    size={16}
                                                    className="text-red-600 dark:text-red-400"
                                                />
                                            </View>
                                            <Text className="font-medium text-destructive">
                                                Delete message
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}
