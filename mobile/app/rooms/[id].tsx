import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageGroup, groupMessages } from '@/components/MessageGroup';
import { MessageInput } from '@/components/MessageInput';
import { Text } from '@/components/ui/text';
import { useRoom, useSocket } from '@/lib/socket';
import type { RoomEventData } from '@/types/server/RoomEventData';

export default function Room() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const roomId = Array.isArray(id) ? id[0] : id;

    if (!roomId) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <Stack.Screen options={{ title: 'Room' }} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-muted-foreground">Invalid room ID</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { messages, sendMessage, isConnected } = useRoom(roomId);
    const { rooms, currentUserId } = useSocket();
    const scrollViewRef = useRef<ScrollView>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            const timeoutId = setTimeout(scrollToBottom, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [messages.length, scrollToBottom]);

    const handleSendMessage = useCallback(
        (messageData: RoomEventData) => {
            sendMessage(messageData);
        },
        [sendMessage]
    );

    // currentUserId now comes from useSocket hook

    const groupedMessages = useMemo(() => {
        return groupMessages(messages, currentUserId || '');
    }, [messages, currentUserId]);

    const getSenderName = useCallback(
        (senderId: String | string) => {
            const senderIdStr = String(senderId);
            return senderIdStr === currentUserId ? 'You' : `User ${senderIdStr.slice(0, 8)}`;
        },
        [currentUserId]
    );

    const getRoomName = useCallback(
        (roomId: string) => {
            const room = rooms.find((r) => r.id === roomId);
            return room ? room.name : `Room ${roomId.slice(0, 8)}...`;
        },
        [rooms]
    );

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    title: getRoomName(roomId),
                    headerRight: () => (
                        <View className="flex-row items-center">
                            <View
                                className={`mr-2 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                            />
                            <Text className="text-xs text-muted-foreground">
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </Text>
                        </View>
                    ),
                }}
            />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                style={{ flex: 1 }}>
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 px-4"
                    contentContainerStyle={{
                        paddingVertical: 16,
                        paddingBottom: 8,
                        flexGrow: 1,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={scrollToBottom}>
                    {messages.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <Text className="text-center text-sm text-muted-foreground">
                                No messages yet.{'\n'}Start the conversation!
                            </Text>
                        </View>
                    ) : (
                        groupedMessages.map((group, index) => (
                            <MessageGroup
                                key={`group-${index}-${group.messages[0].id}`}
                                messages={group.messages}
                                isOwnMessage={group.isOwnMessage}
                                senderName={getSenderName(group.senderId)}
                            />
                        ))
                    )}
                </ScrollView>

                <MessageInput
                    onSendMessage={handleSendMessage}
                    disabled={!isConnected}
                    placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
