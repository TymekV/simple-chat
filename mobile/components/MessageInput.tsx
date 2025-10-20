import React, { useState, useRef, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { ImagePicker } from '@/components/ImagePicker';
import { ReplyPreview } from '@/components/ReplyPreview';
import type { RoomEventData } from '@/types/server/RoomEventData';
import type { MessageReply } from '@/types/server/MessageReply';

interface MessageInputProps {
    onSendMessage: (message: RoomEventData) => void;
    disabled?: boolean;
    placeholder?: string;
    onStartTyping?: () => void;
    onStopTyping?: () => void;
    replyTo?: MessageReply | null;
    onClearReply?: () => void;
}

export function MessageInput({
    onSendMessage,
    disabled = false,
    placeholder = 'Type a message...',
    onStartTyping,
    onStopTyping,
    replyTo,
    onClearReply,
}: MessageInputProps) {
    const [message, setMessage] = useState('');
    const insets = useSafeAreaInsets();
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);

    const handleSend = () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || disabled) return;

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        const messageData: RoomEventData = {
            Message: {
                content: trimmedMessage,
                edited: false,
                deleted: false,
                reply_to: replyTo || null,
            },
        };

        onSendMessage(messageData);
        setMessage('');

        if (onClearReply) {
            onClearReply();
        }

        if (isTypingRef.current && onStopTyping) {
            onStopTyping();
            isTypingRef.current = false;
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    };

    const handleKeyPress = (e: any) => {
        if (e.nativeEvent.key === 'Enter') {
            if (!e.nativeEvent.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        }
    };

    const handleSubmitEditing = () => {
        handleSend();
    };

    const handleTyping = useCallback(
        (text: string) => {
            setMessage(text);

            if (!onStartTyping || !onStopTyping || disabled) return;

            const hasContent = text.trim().length > 0;

            if (hasContent && !isTypingRef.current) {
                onStartTyping();
                isTypingRef.current = true;
            }

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            if (hasContent) {
                typingTimeoutRef.current = setTimeout(() => {
                    if (isTypingRef.current && onStopTyping) {
                        onStopTyping();
                        isTypingRef.current = false;
                    }
                    typingTimeoutRef.current = null;
                }, 2000);
            } else if (isTypingRef.current) {
                onStopTyping();
                isTypingRef.current = false;
            }
        },
        [onStartTyping, onStopTyping, disabled]
    );

    const handleImageSelected = useCallback(
        (imageData: {
            uri: string;
            base64: string;
            filename: string;
            mimeType: string;
            size: number;
            width?: number;
            height?: number;
        }) => {
            if (disabled) return;

            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            const imageMessage: RoomEventData = {
                Image: {
                    image_data: imageData.base64,
                    filename: imageData.filename,
                    mime_type: imageData.mimeType,
                    size: imageData.size,
                    width: imageData.width || null,
                    height: imageData.height || null,
                    reply_to: replyTo || null,
                },
            };

            onSendMessage(imageMessage);

            if (onClearReply) {
                onClearReply();
            }

            if (isTypingRef.current && onStopTyping) {
                onStopTyping();
                isTypingRef.current = false;
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        },
        [onSendMessage, onStopTyping, disabled]
    );

    return (
        <View className="border-t border-border bg-background">
            {replyTo && onClearReply && (
                <ReplyPreview reply={replyTo} onClearReply={onClearReply} className="mx-4 mt-3" />
            )}

            <View
                className="flex-row items-end gap-2 p-4"
                style={{
                    paddingBottom: Math.max(24, insets.bottom + 8),
                }}>
                <ImagePicker onImageSelected={handleImageSelected} disabled={disabled} />

                <View className="flex-1">
                    <Input
                        value={message}
                        onChangeText={handleTyping}
                        placeholder={
                            replyTo ? `Reply to ${replyTo.username || 'message'}...` : placeholder
                        }
                        multiline
                        textAlignVertical="top"
                        maxLength={1000}
                        editable={!disabled}
                        onKeyPress={handleKeyPress}
                        onSubmitEditing={handleSubmitEditing}
                        returnKeyType={Platform.OS === 'ios' ? 'send' : 'done'}
                        blurOnSubmit={false}
                        enablesReturnKeyAutomatically={true}
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
        </View>
    );
}
