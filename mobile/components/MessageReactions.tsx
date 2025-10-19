import React, { useState } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
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
}: MessageReactionsProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleReactionPress = (emoji: string, userReacted: boolean) => {
        if (userReacted) {
            onRemoveReaction?.(messageId, emoji);
        } else {
            onAddReaction?.(messageId, emoji);
        }
        // Close picker if it was open
        if (showEmojiPicker) {
            setShowEmojiPicker(false);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
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
                    <View
                        className="absolute -top-12 left-0 flex-row items-center gap-1 rounded-lg border border-border bg-background p-2 shadow-lg"
                        style={{ zIndex: 1000 }}>
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
                            <Icon as={Plus} size={14} className="rotate-45 text-muted-foreground" />
                        </Pressable>
                    </View>
                ) : (
                    <Pressable
                        onPress={() => setShowEmojiPicker(true)}
                        className="ml-1 h-6 w-6 items-center justify-center rounded-full bg-muted/50">
                        <Icon as={Plus} size={12} className="text-muted-foreground" />
                    </Pressable>
                )}
            </View>
        </View>
    );
}
