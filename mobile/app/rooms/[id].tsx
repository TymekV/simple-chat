import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MessageGroup, groupMessages } from '@/components/MessageGroup';
import { MessageInput } from '@/components/MessageInput';
import { UsernameSetup } from '@/components/UsernameSetup';
import { RoomInfo } from '@/components/RoomInfo';
import { SystemMessage } from '@/components/SystemMessage';
import { TypingIndicator } from '@/components/TypingIndicator';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Info } from 'lucide-react-native';
import { useRoom, useSocket } from '@/lib/socket';
import type { RoomEventData } from '@/types/server/RoomEventData';

export default function Room() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const roomId = Array.isArray(id) ? id[0] : id;

    if (!roomId) {
        return (
            <View className="flex-1 bg-background">
                <Stack.Screen options={{ title: 'Room' }} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-muted-foreground">Invalid room ID</Text>
                </View>
            </View>
        );
    }

    const {
        messages,
        sendMessage,
        isConnected,
        typingUsers,
        startTyping,
        stopTyping,
        editMessage,
        deleteMessage,
    } = useRoom(roomId);
    const { rooms, currentUserId, setUsername, currentUsername, roomMembers } = useSocket();
    const scrollViewRef = useRef<ScrollView>(null);

    const [showUsernameSetup, setShowUsernameSetup] = useState(false);
    const [showRoomInfo, setShowRoomInfo] = useState(false);
    const [isSettingUsername, setIsSettingUsername] = useState(false);

    const messageReactions = useMemo(() => {
        const reactions: {
            [messageId: string]: Array<{
                emoji: string;
                count: number;
                userReacted: boolean;
            }>;
        } = {};

        const reactionMap = new Map<string, { userId: string; messageId: string; emoji: string }>();

        messages.forEach((event) => {
            const userId = String(event.from);

            if ('Reaction' in event.data) {
                const { message_id, reaction } = event.data.Reaction;
                const messageId = String(message_id);
                const key = `${userId}-${messageId}-${reaction}`;

                reactionMap.set(key, { userId, messageId, emoji: reaction });
            } else if ('ReactionRemove' in event.data) {
                const { message_id, reaction } = event.data.ReactionRemove;
                const messageId = String(message_id);
                const key = `${userId}-${messageId}-${reaction}`;

                reactionMap.delete(key);
            }
        });

        reactionMap.forEach(({ userId, messageId, emoji }) => {
            if (!reactions[messageId]) {
                reactions[messageId] = [];
            }

            const existingReaction = reactions[messageId].find((r) => r.emoji === emoji);
            if (existingReaction) {
                existingReaction.count++;
                if (userId === currentUserId) {
                    existingReaction.userReacted = true;
                }
            } else {
                reactions[messageId].push({
                    emoji,
                    count: 1,
                    userReacted: userId === currentUserId,
                });
            }
        });

        return reactions;
    }, [messages, currentUserId]);

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

    useEffect(() => {
        if (currentUserId && currentUsername === null) {
            setShowUsernameSetup(true);
        } else {
            setShowUsernameSetup(false);
        }
    }, [currentUserId, currentUsername]);

    const prevIsConnected = useRef(isConnected);
    useEffect(() => {
        if (prevIsConnected.current !== undefined && prevIsConnected.current !== isConnected) {
            if (Platform.OS !== 'web') {
                if (isConnected) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                }
            }
        }
        prevIsConnected.current = isConnected;
    }, [isConnected]);

    const handleSendMessage = useCallback(
        (messageData: RoomEventData) => {
            sendMessage(messageData);
        },
        [sendMessage]
    );

    const allEvents = useMemo(() => {
        return [...messages].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    }, [messages]);

    const messageEvents = useMemo(() => {
        return messages.filter((event) => 'Message' in event.data || 'Image' in event.data);
    }, [messages]);

    const groupedMessages = useMemo(() => {
        return groupMessages(messageEvents, currentUserId || '');
    }, [messageEvents, currentUserId]);

    const getSenderName = useCallback(
        (senderId: String | string) => {
            const senderIdStr = String(senderId);
            if (senderIdStr === currentUserId) {
                return 'You';
            }
            const member = roomMembers.find((m) => String(m.user_id) === senderIdStr);
            if (member?.username) {
                return member.username;
            }
            return `User ${senderIdStr.slice(0, 8)}`;
        },
        [currentUserId, roomMembers]
    );

    const getRoomName = useCallback(
        (roomId: string) => {
            const room = rooms.find((r) => r.id === roomId);
            return room ? room.name : `Room ${roomId.slice(0, 8)}...`;
        },
        [rooms]
    );

    const handleAddReaction = useCallback(
        (messageId: string, emoji: string) => {
            const existingReactions = messageReactions[messageId] || [];
            const existingReaction = existingReactions.find(
                (r) => r.emoji === emoji && r.userReacted
            );

            if (existingReaction) {
                return;
            }

            const reactionData: RoomEventData = {
                Reaction: {
                    message_id: messageId,
                    reaction: emoji,
                },
            };

            sendMessage(reactionData);
        },
        [messageReactions, sendMessage]
    );

    const handleRemoveReaction = useCallback(
        (messageId: string, emoji: string) => {
            const reactionRemoveData: RoomEventData = {
                ReactionRemove: {
                    message_id: messageId,
                    reaction: emoji,
                },
            };

            sendMessage(reactionRemoveData);
        },
        [sendMessage]
    );

    const handleEditMessage = useCallback(
        (messageId: string, newContent: string) => {
            editMessage(messageId, newContent);
        },
        [editMessage]
    );

    const handleDeleteMessage = useCallback(
        (messageId: string) => {
            deleteMessage(messageId);
        },
        [deleteMessage]
    );

    const getMessageReactions = useCallback(
        (messageId: string) => {
            const reactions = messageReactions[messageId] || [];
            return reactions.filter((reaction) => reaction.count > 0);
        },
        [messageReactions]
    );

    const handleSetUsername = useCallback(
        (username: string) => {
            setIsSettingUsername(true);
            setUsername(username);
            setTimeout(() => {
                setIsSettingUsername(false);
            }, 1000);
        },
        [setUsername]
    );

    return (
        <View className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    title: getRoomName(roomId),
                    headerRight: () => (
                        <View className="flex-row items-center">
                            <Pressable
                                onPress={() => {
                                    if (Platform.OS !== 'web') {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }
                                    setShowRoomInfo(true);
                                }}
                                className="mr-4 p-1">
                                <Icon as={Info} size={20} className="text-primary" />
                            </Pressable>
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
                    {allEvents.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <Text className="text-center text-sm text-muted-foreground">
                                No messages yet.{'\n'}Start the conversation!
                            </Text>
                        </View>
                    ) : (
                        allEvents.map((event) => {
                            if ('Message' in event.data || 'Image' in event.data) {
                                const group = groupedMessages.find((g) =>
                                    g.messages.some((msg) => msg.id === event.id)
                                );
                                if (group) {
                                    const isFirstInGroup = group.messages[0].id === event.id;
                                    if (isFirstInGroup) {
                                        return (
                                            <MessageGroup
                                                key={`group-${event.id}`}
                                                messages={group.messages}
                                                isOwnMessage={group.isOwnMessage}
                                                senderName={getSenderName(group.senderId)}
                                                onAddReaction={handleAddReaction}
                                                onRemoveReaction={handleRemoveReaction}
                                                getMessageReactions={getMessageReactions}
                                                onEditMessage={handleEditMessage}
                                                onDeleteMessage={handleDeleteMessage}
                                            />
                                        );
                                    }
                                }
                                return null;
                            } else if ('UserJoin' in event.data || 'UserLeave' in event.data) {
                                return <SystemMessage key={event.id} event={event} />;
                            }
                            return null;
                        })
                    )}
                </ScrollView>

                <TypingIndicator typingUsers={typingUsers} className="border-t border-border" />

                <MessageInput
                    onSendMessage={handleSendMessage}
                    disabled={!isConnected}
                    placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
                    onStartTyping={startTyping}
                    onStopTyping={stopTyping}
                />
            </KeyboardAvoidingView>

            <UsernameSetup
                visible={showUsernameSetup}
                onSetUsername={handleSetUsername}
                loading={isSettingUsername}
            />

            <RoomInfo
                visible={showRoomInfo}
                onClose={() => setShowRoomInfo(false)}
                roomId={roomId}
                roomName={getRoomName(roomId)}
            />
        </View>
    );
}
