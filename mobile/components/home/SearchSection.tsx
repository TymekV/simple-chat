import React from 'react';
import { View } from 'react-native';
import { SearchInput } from '@/components/common';
import { SearchResults } from './SearchResults';
import { RoomList } from './RoomList';
import type { RoomListItem } from '@/types/server/RoomListItem';
import { cn } from '@/lib/utils';

interface SearchSectionProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onClearSearch: () => void;
    allRooms: RoomListItem[];
    filteredRooms: RoomListItem[];
    onRoomPress?: (room: RoomListItem) => void;
    onCreateRoom?: () => void;
    className?: string;
}

export function SearchSection({
    searchQuery,
    onSearchChange,
    onClearSearch,
    allRooms,
    filteredRooms,
    onRoomPress,
    onCreateRoom,
    className,
}: SearchSectionProps) {
    const hasSearchQuery = searchQuery.trim().length > 0;
    const showingResults = hasSearchQuery;

    return (
        <View className={cn('flex-1', className)}>
            <View className="mb-3 px-4 pt-3">
                <SearchInput
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    onClear={onClearSearch}
                    placeholder="Search rooms..."
                />
            </View>

            {showingResults ? (
                <View className="flex-1 px-4">
                    <SearchResults
                        rooms={filteredRooms}
                        searchQuery={searchQuery}
                        onClearSearch={onClearSearch}
                        onRoomPress={onRoomPress}
                        onCreateRoom={onCreateRoom}
                    />
                </View>
            ) : (
                <RoomList
                    rooms={allRooms}
                    onRoomPress={onRoomPress}
                    onCreateRoom={onCreateRoom}
                    className="px-4"
                />
            )}
        </View>
    );
}
