import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { SearchIcon } from 'lucide-react-native';
import { RoomList } from './RoomList';
import type { RoomListItem } from '@/types/server/RoomListItem';

interface NoResultsStateProps {
    searchQuery: string;
    onClearSearch: () => void;
}

function NoResultsState({ searchQuery, onClearSearch }: NoResultsStateProps) {
    return (
        <View className="flex-1 items-center justify-center py-12">
            <Icon as={SearchIcon} className="mb-4 size-12 text-muted-foreground" />
            <Text className="mb-2 text-lg font-medium">No rooms found</Text>
            <Text className="mb-6 px-4 text-center text-muted-foreground">
                No rooms match your search "{searchQuery}". Try a different search term.
            </Text>
            <Button variant="outline" onPress={onClearSearch}>
                <Text>Clear Search</Text>
            </Button>
        </View>
    );
}

interface SearchResultsProps {
    rooms: RoomListItem[];
    searchQuery: string;
    onClearSearch: () => void;
    onRoomPress?: (room: RoomListItem) => void;
    onCreateRoom?: () => void;
}

export function SearchResults({
    rooms,
    searchQuery,
    onClearSearch,
    onRoomPress,
    onCreateRoom
}: SearchResultsProps) {
    if (rooms.length === 0 && searchQuery.trim()) {
        return <NoResultsState searchQuery={searchQuery} onClearSearch={onClearSearch} />;
    }

    return (
        <RoomList
            rooms={rooms}
            onRoomPress={onRoomPress}
            onCreateRoom={onCreateRoom}
            showCreatePrompt={rooms.length > 0}
        />
    );
}
