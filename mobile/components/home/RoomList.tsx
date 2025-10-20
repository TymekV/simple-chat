import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { PlusIcon } from 'lucide-react-native';
import { RoomCard } from './RoomCard';
import type { RoomListItem } from '@/types/server/RoomListItem';

interface CreateRoomPromptProps {
    onPress?: () => void;
}

function CreateRoomPrompt({ onPress }: CreateRoomPromptProps) {
    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
    };

    return (
        <View className="pb-4">
            <Link href="/create-room" asChild>
                <Button variant="outline" className="border-dashed" onPress={handlePress}>
                    <Icon as={PlusIcon} className="mr-2 size-4" />
                    <Text>Create New Room</Text>
                </Button>
            </Link>
        </View>
    );
}

interface RoomListProps {
    rooms: RoomListItem[];
    onRoomPress?: (room: RoomListItem) => void;
    onCreateRoom?: () => void;
    showCreatePrompt?: boolean;
    className?: string;
}

export function RoomList({
    rooms,
    onRoomPress,
    onCreateRoom,
    showCreatePrompt = true,
    className,
}: RoomListProps) {
    const handleRoomPress = (room: RoomListItem) => {
        onRoomPress?.(room);
    };

    return (
        <ScrollView className={`flex-1 ${className || ''}`} showsVerticalScrollIndicator={false}>
            {rooms.map((room) => (
                <RoomCard key={room.id} room={room} onPress={() => handleRoomPress(room)} />
            ))}

            {showCreatePrompt && <CreateRoomPrompt onPress={onCreateRoom} />}
        </ScrollView>
    );
}
