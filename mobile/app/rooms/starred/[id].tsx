import React, { useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { MessageGroup, groupMessages } from '@/components/MessageGroup';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useRoom, useSocket } from '@/lib/socket';
import { useStarredMessages } from '@/hooks/useStarredMessages';
import type { RoomEventData } from '@/types/server/RoomEventData';

export default function StarredMessages() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const roomId = Array.isArray(id) ? id[0] : id;

    if (!roomId) {
        return (
            <View className="flex-1 bg-background">
                <Stack.Screen options={{ title: 'Starred Messages' }} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-muted-foreground">Invalid room ID</Text>
                </View>
            </View>
        );
    }

    const { messages } = useRoom(roomId);
    const { rooms, currentUserId, roomMembers } = useSocket();
    const { starredMessageIds, unstarMessage, isMessageStarred } = useStarredMessages(roomId);

    const room = rooms.find((r) => r.id === roomId);
    const roomName = room ? room.name : `Room ${roomId.slice(0, 8)}...`;

    const starredMessages = useMemo(() => {
        return messages.filter((message) => starredMessageIds.has(message.id));
    }, [messages, starredMessageIds]);

    const groupedMessages = useMemo(() => {
        return groupMessages(starredMessages, currentUserId || '');
    }, [starredMessages, currentUserId]);

    const getSenderName = (senderId: string) => {
        const senderIdStr = String(senderId);
        if (senderIdStr === currentUserId) {
            return 'You';
        }
        const member = roomMembers.find((m) => String(m.user_id) === senderIdStr);
        if (member?.username) {
            return member.username;
        }
        return `User ${senderIdStr.slice(0, 8)}`;
    };

    const handleUnstarMessage = (messageId: string) => {
        unstarMessage(roomId, messageId);
    };

    const handleGoBack = () => {
        router.back();
    };

    return (
        <View className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    title: 'Starred Messages',
                    headerLeft: () => (
                        <Pressable onPress={handleGoBack} className="mr-4">
                            <Icon as={ArrowLeft} size={24} className="text-foreground" />
                        </Pressable>
                    ),
                    headerTitle: () => (
                        <View className="flex-1 items-center">
                            <Text className="text-lg font-semibold">Starred Messages</Text>
                            <Text className="text-sm text-muted-foreground">{roomName}</Text>
                        </View>
                    ),
                }}
            />

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 16 }}>
                {groupedMessages.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <Icon as={Star} size={48} className="mb-4 text-muted-foreground" />
                        <Text className="mb-2 text-lg font-medium">No starred messages</Text>
                        <Text className="text-center text-muted-foreground">
                            Star messages in the chat to see them here
                        </Text>
                    </View>
                ) : (
                    <View className="gap-4">
                        <View className="mb-2">
                            <Text className="text-sm text-muted-foreground">
                                {starredMessages.length}{' '}
                                {starredMessages.length === 1 ? 'message' : 'messages'} starred
                            </Text>
                        </View>

                        {groupedMessages.map((group) => {
                            const groupId = `group-${group.senderId}-${group.messages[0].id}`;
                            return (
                                <View
                                    key={groupId}
                                    className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                    <MessageGroup
                                        messages={group.messages}
                                        isOwnMessage={group.isOwnMessage}
                                        senderName={getSenderName(group.senderId)}
                                        onUnstarMessage={handleUnstarMessage}
                                        isMessageStarred={isMessageStarred}
                                        getMessageReactions={() => []} // No reactions in starred view for simplicity
                                    />
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
