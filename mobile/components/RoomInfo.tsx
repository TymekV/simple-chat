import React, { useEffect } from 'react';
import { View, Modal, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { X, Users, User } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useSocket } from '@/lib/socket';
import type { RoomMember } from '@/types/server/RoomMember';

interface RoomInfoProps {
    visible: boolean;
    onClose: () => void;
    roomId: string;
    roomName: string;
}

export function RoomInfo({ visible, onClose, roomId, roomName }: RoomInfoProps) {
    const { getRoomMembers, roomMembers, currentUserId } = useSocket();

    useEffect(() => {
        if (visible && roomId) {
            getRoomMembers(roomId);
        }
    }, [visible, roomId, getRoomMembers]);

    const formatUserId = (userId: string) => {
        return userId.slice(0, 8);
    };

    const getMemberDisplayName = (member: RoomMember) => {
        if (member.username) {
            return member.username;
        }
        return `User ${formatUserId(String(member.user_id))}`;
    };

    const isCurrentUser = (member: RoomMember) => {
        return String(member.user_id) === currentUserId;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}>
            <View className="flex-1 bg-background">
                {/* Header */}
                <View className="flex-row items-center justify-between p-4 border-b border-border">
                    <Text className="text-lg font-semibold">Room Info</Text>
                    <Pressable
                        onPress={onClose}
                        className="w-8 h-8 items-center justify-center rounded-full active:bg-muted">
                        <Icon as={X} size={20} className="text-muted-foreground" />
                    </Pressable>
                </View>

                <ScrollView className="flex-1 p-4">
                    {/* Room Name Section */}
                    <View className="mb-6">
                        <Text className="text-sm text-muted-foreground mb-2">ROOM NAME</Text>
                        <View className="bg-muted/50 rounded-lg p-3">
                            <Text className="text-base font-medium">{roomName}</Text>
                        </View>
                    </View>

                    {/* Members Section */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-3">
                            <Icon as={Users} size={16} className="text-muted-foreground mr-2" />
                            <Text className="text-sm text-muted-foreground">
                                MEMBERS ({roomMembers.length})
                            </Text>
                        </View>

                        {roomMembers.length === 0 ? (
                            <View className="py-8 items-center">
                                <Icon as={Users} size={32} className="text-muted-foreground mb-2" />
                                <Text className="text-muted-foreground text-center">
                                    Loading members...
                                </Text>
                            </View>
                        ) : (
                            <View className="space-y-2">
                                {roomMembers.map((member) => (
                                    <View
                                        key={String(member.user_id)}
                                        className="flex-row items-center p-3 bg-muted/30 rounded-lg">
                                        <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
                                            <Icon as={User} size={20} className="text-primary" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-medium">
                                                {getMemberDisplayName(member)}
                                                {isCurrentUser(member) && (
                                                    <Text className="text-primary"> (You)</Text>
                                                )}
                                            </Text>
                                            <Text className="text-xs text-muted-foreground">
                                                ID: {formatUserId(String(member.user_id))}
                                            </Text>
                                        </View>
                                        {isCurrentUser(member) && (
                                            <View className="bg-primary/10 px-2 py-1 rounded-full">
                                                <Text className="text-xs text-primary font-medium">
                                                    You
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Room ID Section */}
                    <View className="mb-6">
                        <Text className="text-sm text-muted-foreground mb-2">ROOM ID</Text>
                        <View className="bg-muted/50 rounded-lg p-3">
                            <Text className="text-sm font-mono text-muted-foreground">
                                {roomId}
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View className="p-4 border-t border-border">
                    <Button onPress={onClose} variant="outline" className="w-full">
                        <Text>Close</Text>
                    </Button>
                </View>
            </View>
        </Modal>
    );
}
