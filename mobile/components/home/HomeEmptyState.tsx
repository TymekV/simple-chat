import React from 'react';
import { Platform } from 'react-native';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { PlusIcon, UsersIcon } from 'lucide-react-native';
import { EmptyState } from '@/components/common';

interface HomeEmptyStateProps {
    onCreateRoom?: () => void;
}

export function HomeEmptyState({ onCreateRoom }: HomeEmptyStateProps) {
    const handleCreateRoom = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onCreateRoom?.();
    };

    return (
        <EmptyState
            icon={UsersIcon}
            title="No rooms available"
            description="Create the first room to start chatting with others">
            <Link href="/create-room" asChild>
                <Button onPress={handleCreateRoom}>
                    <Icon as={PlusIcon} className="mr-2 size-4" />
                    <Text>Create Room</Text>
                </Button>
            </Link>
        </EmptyState>
    );
}
