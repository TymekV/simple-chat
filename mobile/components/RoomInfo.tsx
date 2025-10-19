import React, { useEffect } from 'react';
import { View, Modal, ScrollView, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();

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
                <View
                    className="flex-row items-center justify-between border-b border-border p-4"
                    style={{ paddingTop: Math.max(16, insets.top + 8) }}>
                    <Text className="text-lg font-semibold">Room Info</Text>
                    <Pressable
                        onPress={() => {
                            if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            onClose();
                        }}
                        className="h-8 w-8 items-center justify-center rounded-full active:bg-muted">
                        <Icon as={X} size={20} className="text-muted-foreground" />
                    </Pressable>
                </View>

                <ScrollView className="flex-1 p-4">
                    <View className="mb-6">
                        <Text className="mb-2 text-sm text-muted-foreground">ROOM NAME</Text>
                        <View className="rounded-lg bg-muted/50 p-3">
                            <Text className="text-base font-medium">{roomName}</Text>
                        </View>
                    </View>

                    <View className="mb-6">
                        <View className="mb-3 flex-row items-center">
                            <Icon as={Users} size={16} className="mr-2 text-muted-foreground" />
                            <Text className="text-sm text-muted-foreground">
                                MEMBERS ({roomMembers.length})
                            </Text>
                        </View>

                        {roomMembers.length === 0 ? (
                            <View className="items-center py-8">
                                <Icon as={Users} size={32} className="mb-2 text-muted-foreground" />
                                <Text className="text-center text-muted-foreground">
                                    Loading members...
                                </Text>
                            </View>
                        ) : (
                            <View className="space-y-2">
                                {roomMembers.map((member) => (
                                    <View
                                        key={String(member.user_id)}
                                        className="flex-row items-center rounded-lg bg-muted/30 p-3">
                                        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
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
                                            <View className="rounded-full bg-primary/10 px-2 py-1">
                                                <Text className="text-xs font-medium text-primary">
                                                    You
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View className="mb-6">
                        <Text className="mb-2 text-sm text-muted-foreground">ROOM ID</Text>
                        <View className="rounded-lg bg-muted/50 p-3">
                            <Text className="font-mono text-sm text-muted-foreground">
                                {roomId}
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                <View
                    className="border-t border-border p-4"
                    style={{ paddingBottom: Math.max(16, insets.bottom + 8) }}>
                    <Button
                        onPress={() => {
                            if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            onClose();
                        }}
                        variant="outline"
                        className="w-full">
                        <Text>Close</Text>
                    </Button>
                </View>
            </View>
        </Modal>
    );
}
