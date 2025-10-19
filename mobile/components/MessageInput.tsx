import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Send } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import type { RoomEventData } from '@/types/server/RoomEventData';

interface MessageInputProps {
    onSendMessage: (message: RoomEventData) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function MessageInput({
    onSendMessage,
    disabled = false,
    placeholder = 'Type a message...',
}: MessageInputProps) {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || disabled) return;

        const messageData: RoomEventData = {
            Message: {
                content: trimmedMessage,
            },
        };

        onSendMessage(messageData);
        setMessage('');
    };

    const handleKeyPress = (e: any) => {
        if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <View className="flex-row items-end gap-2 border-t border-border bg-background p-4">
            <View className="flex-1">
                <Input
                    value={message}
                    onChangeText={setMessage}
                    placeholder={placeholder}
                    multiline
                    textAlignVertical="top"
                    maxLength={1000}
                    editable={!disabled}
                    onKeyPress={handleKeyPress}
                    className="max-h-[120px] min-h-[40px]"
                    style={{
                        paddingTop: Platform.OS === 'ios' ? 12 : 8,
                        paddingBottom: Platform.OS === 'ios' ? 12 : 8,
                    }}
                />
            </View>

            <Button
                onPress={handleSend}
                disabled={disabled || !message.trim()}
                size="icon"
                className="h-10 w-10 rounded-full">
                <Icon as={Send} size={18} className="text-primary-foreground" />
            </Button>
        </View>
    );
}
