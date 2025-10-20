import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Image as ImageIcon } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import type { MessageReply } from '@/types/server/MessageReply';

interface ReplyPreviewProps {
    reply: MessageReply;
    onClearReply: () => void;
    className?: string;
}

export function ReplyPreview({ reply, onClearReply, className }: ReplyPreviewProps) {
    const getReplyIcon = () => {
        switch (reply.message_type) {
            case 'Image':
                return ImageIcon;
            case 'Deleted':
                return null;
            default:
                return null;
        }
    };

    const ReplyIcon = getReplyIcon();

    return (
        <View className={cn('border-l-4 border-primary bg-muted/50 p-3', className)}>
            <View className="flex-row items-start justify-between">
                <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                        {ReplyIcon && (
                            <Icon as={ReplyIcon} size={14} className="text-muted-foreground" />
                        )}
                        <Text className="text-xs font-medium text-primary">
                            {reply.username || `User ${reply.user_id.toString().slice(0, 8)}`}
                        </Text>
                    </View>
                    <Text
                        className={cn(
                            'mt-1 text-sm',
                            reply.message_type === 'Deleted'
                                ? 'italic text-muted-foreground'
                                : 'text-foreground'
                        )}
                        numberOfLines={2}>
                        {reply.content_preview}
                    </Text>
                </View>
                <Pressable onPress={onClearReply} className="ml-2 p-1">
                    <Icon as={X} size={16} className="text-muted-foreground" />
                </Pressable>
            </View>
        </View>
    );
}
