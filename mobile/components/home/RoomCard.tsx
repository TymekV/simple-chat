import React from 'react';
import { Platform } from 'react-native';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { UsersIcon } from 'lucide-react-native';
import type { RoomListItem } from '@/types/server/RoomListItem';

interface RoomCardProps {
    room: RoomListItem;
    onPress?: () => void;
}

interface RoomInfoProps {
    name: string;
    memberCount: number;
}

function RoomInfo({ name, memberCount }: RoomInfoProps) {
    return (
        <View className="flex-1">
            <Text className="mb-2 text-left font-medium">{name}</Text>
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <Icon as={UsersIcon} className="mr-1 size-3 text-muted-foreground" />
                    <Text className="text-xs text-muted-foreground">
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </Text>
                </View>
                <Badge variant="secondary" size="sm">
                    Active
                </Badge>
            </View>
        </View>
    );
}

export function RoomCard({ room, onPress }: RoomCardProps) {
    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
    };

    return (
        <Link href={`/rooms/${room.id}`} asChild>
            <Card className="mb-3 p-4" onPress={handlePress}>
                <View className="flex-1 flex-row items-center">
                    <RoomInfo name={room.name} memberCount={room.member_count} />
                </View>
            </Card>
        </Link>
    );
}
