import React, { useState } from 'react';
import { View, Pressable, Text as RNText, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react-native';
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

    const hasReactions = reactions.length > 0;

    return (
        <View className={cn('mt-1 flex-row items-center gap-1', className)}>
            {reactions.map((reaction) => (
                <ReactionButton
                    key={reaction.emoji}
                    reaction={reaction}
                    onPress={() => handleReactionPress(reaction.emoji, reaction.userReacted)}
                />
            ))}

            <View className="relative">
                {showEmojiPicker || showPicker ? (
                    <>
                        <View
                            className="absolute -inset-2 rounded-xl bg-black/5"
                            style={{ zIndex: 998 }}
                        />

                        <View
                            className={cn(
                                'absolute -top-2 h-3 w-3 rotate-45 border border-border bg-background',
                                isOwnMessage ? 'right-4' : 'left-4'
                            )}
                            style={{
                                zIndex: 999,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                            }}
                        />
                        <View
                            className={cn(
                                'absolute -top-14 flex-row items-center gap-1 rounded-lg border border-border bg-background p-2',
                                isOwnMessage ? '-right-2' : '-left-2'
                            )}
                            style={{
                                zIndex: 1000,
                                minWidth: 240,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: 8,
                            }}>
                            {COMMON_EMOJIS.map((emoji) => (
                                <Pressable
                                    key={emoji}
                                    onPress={() => handleEmojiSelect(emoji)}
                                    className="h-8 w-8 items-center justify-center rounded-md active:scale-95 active:bg-muted">
                                    <RNText className="text-lg">{emoji}</RNText>
                                </Pressable>
                            ))}
                            <Pressable
                                onPress={() => {
                                    setShowEmojiPicker(false);
                                    onClosePicker?.();
                                }}
                                className="ml-1 h-8 w-8 items-center justify-center rounded-md active:bg-muted">
                                <Icon
                                    as={Plus}
                                    size={14}
                                    className="rotate-45 text-muted-foreground"
                                />
                            </Pressable>
                        </View>
                    </>
                ) : (
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
                )}
            </View>
        </View>
    );
}
