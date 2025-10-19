import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/lib/socket';

export default function CreateRoom() {
    const [roomName, setRoomName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { createRoom, isConnected } = useSocket();
    const router = useRouter();

    const handleCreateRoom = async () => {
        if (!roomName.trim()) {
            Alert.alert('Error', 'Please enter a room name');
            return;
        }

        if (!isConnected) {
            Alert.alert('Error', 'Not connected to server');
            return;
        }

        setIsCreating(true);
        try {
            createRoom(roomName.trim());
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to create room');
            console.error('Failed to create room:', error);
        } finally {
            setIsCreating(false);
        }
    };

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

                <View className="mb-4">
                    <Text className="mb-2 text-sm font-medium">Room Name</Text>
                    <Input
                        value={roomName}
                        onChangeText={setRoomName}
                        placeholder="Enter room name..."
                        className="mb-2"
                        editable={!isCreating}
                        maxLength={50}
                    />
                    <Text className="text-xs text-muted-foreground">
                        {roomName.length}/50 characters
                    </Text>
                </View>

                <View className="flex-row gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onPress={() => router.back()}
                        disabled={isCreating}>
                        <Text>Cancel</Text>
                    </Button>

                    <Button
                        className="flex-1"
                        onPress={handleCreateRoom}
                        disabled={!roomName.trim() || !isConnected || isCreating}>
                        <Text>{isCreating ? 'Creating...' : 'Create Room'}</Text>
                    </Button>
                </View>

                {!isConnected && (
                    <View className="mt-4 rounded-md bg-destructive/10 p-3">
                        <Text className="text-center text-sm text-destructive">
                            Not connected to server. Please check your connection.
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}
