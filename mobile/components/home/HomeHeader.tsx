import React from 'react';
import { Link } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { PlusIcon } from 'lucide-react-native';
import { ThemeToggle, ActionButton } from '@/components/common';

interface UserBadgeProps {
    username: string;
}

function UserBadge({ username }: UserBadgeProps) {
    return (
        <View className="mr-2 rounded-full bg-primary/10 px-3 py-1">
            <Text className="text-xs font-medium text-primary">{username}</Text>
        </View>
    );
}

interface CreateRoomButtonProps {
    onPress?: () => void;
}

function CreateRoomButton({ onPress }: CreateRoomButtonProps) {
    return (
        <Link href="/create-room" asChild>
            <ActionButton
                title=""
                onPress={() => onPress?.()}
                icon={PlusIcon}
                variant="ghost"
                size="icon"
                className="ios:size-9 rounded-full"
                hapticFeedback="light"
            />
        </Link>
    );
}

interface HomeHeaderProps {
    currentUsername: string | null;
    onCreateRoom?: () => void;
}

export function HomeHeader({ currentUsername, onCreateRoom }: HomeHeaderProps) {
    return (
        <View className="flex-row items-center gap-1">
            {currentUsername && <UserBadge username={currentUsername} />}
            <ThemeToggle />
            <CreateRoomButton onPress={onCreateRoom} />
        </View>
    );
}
