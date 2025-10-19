import React, { useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/lib/socket';

interface RoomNameInputProps {
    value: string;
    onChangeText: (text: string) => void;
    maxLength: number;
    disabled?: boolean;
}

function RoomNameInput({ value, onChangeText, maxLength, disabled = false }: RoomNameInputProps) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-sm font-medium">Room Name</Text>
            <Input
                value={value}
                onChangeText={onChangeText}
                placeholder="Enter room name..."
                className="mb-2"
                editable={!disabled}
                maxLength={maxLength}
            />
            <Text className="text-xs text-muted-foreground">
                {value.length}/{maxLength} characters
            </Text>
        </View>
    );
}

interface CreateRoomActionsProps {
    onCancel: () => void;
    onCreateRoom: () => void;
    isCreating: boolean;
    isConnected: boolean;
    canCreate: boolean;
}

function CreateRoomActions({
    onCancel,
    onCreateRoom,
    isCreating,
    isConnected,
    canCreate,
}: CreateRoomActionsProps) {
    return (
        <View className="flex-row gap-3">
            <Button variant="outline" className="flex-1" onPress={onCancel} disabled={isCreating}>
                <Text>Cancel</Text>
            </Button>

            <Button
                className="flex-1"
                onPress={onCreateRoom}
                disabled={!canCreate || !isConnected || isCreating}>
                <Text>{isCreating ? 'Creating...' : 'Create Room'}</Text>
            </Button>
        </View>
    );
}

interface ConnectionWarningProps {
    isConnected: boolean;
}

function ConnectionWarning({ isConnected }: ConnectionWarningProps) {
    if (isConnected) {
        return null;
    }

    return (
        <View className="mt-4 rounded-md bg-destructive/10 p-3">
            <Text className="text-center text-sm text-destructive">
                Not connected to server. Please check your connection.
            </Text>
        </View>
    );
}

export default function CreateRoom() {
    const [roomName, setRoomName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { createRoom, isConnected } = useSocket();
    const router = useRouter();

    const handleCreateRoom = useCallback(async () => {
        if (!roomName.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (!isConnected) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setIsCreating(true);
        try {
            createRoom(roomName.trim());

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            router.back();
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error('Failed to create room:', error);
        } finally {
            setIsCreating(false);
        }
    }, [roomName, isConnected, createRoom, router]);

    const handleCancel = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    }, [router]);

    const canCreate = roomName.trim().length > 0;

    return (
        <View className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    title: 'Create Room',
                    headerBackTitle: 'Back',
                }}
            />

            <View className="flex-1 p-4">
                <View className="mb-4">
                    <Text className="mb-2 text-2xl font-bold">Create a New Room</Text>
                    <Text className="text-muted-foreground">
                        Enter a name for your new chat room. Other users will be able to join and
                        participate in conversations.
                    </Text>
                </View>

                <RoomNameInput
                    value={roomName}
                    onChangeText={setRoomName}
                    maxLength={50}
                    disabled={isCreating}
                />

                <CreateRoomActions
                    onCancel={handleCancel}
                    onCreateRoom={handleCreateRoom}
                    isCreating={isCreating}
                    isConnected={isConnected}
                    canCreate={canCreate}
                />

                <ConnectionWarning isConnected={isConnected} />
            </View>
        </View>
    );
}
