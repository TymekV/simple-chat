import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSocket } from '@/lib/socket';
import type { RoomListItem } from '@/types/server/RoomListItem';

interface UseHomeScreenReturn {
    // Data
    rooms: RoomListItem[];
    filteredRooms: RoomListItem[];
    currentUsername: string | null;
    currentUserId: string | null;
    isConnected: boolean;

    // Search state
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    clearSearch: () => void;

    // Loading states
    isLoading: boolean;
    isSettingUsername: boolean;
    showUsernameSetup: boolean;

    // Actions
    handleSetUsername: (username: string) => void;
    handleRetryConnection: () => void;

    // Computed states
    isEmpty: boolean;
    hasSearchResults: boolean;
    showConnectionError: boolean;
}

export function useHomeScreen(): UseHomeScreenReturn {
    const { rooms, isConnected, currentUsername, setUsername, currentUserId, loadRoomList } =
        useSocket();

    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showUsernameSetup, setShowUsernameSetup] = useState(false);
    const [isSettingUsername, setIsSettingUsername] = useState(false);

    useEffect(() => {
        if (currentUserId && currentUsername === null) {
            setShowUsernameSetup(true);
        } else {
            setShowUsernameSetup(false);
        }
    }, [currentUserId, currentUsername]);

    useEffect(() => {
        if (isConnected) {
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setIsLoading(false);
        }
    }, [isConnected, rooms]);

    const filteredRooms = useMemo(() => {
        if (!searchQuery.trim()) {
            return rooms;
        }
        return rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [rooms, searchQuery]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    const handleSetUsername = useCallback(
        (username: string) => {
            setIsSettingUsername(true);
            setUsername(username);
            setTimeout(() => {
                setIsSettingUsername(false);
            }, 1000);
        },
        [setUsername]
    );

    const handleRetryConnection = useCallback(() => {
        loadRoomList();
    }, [loadRoomList]);

    const isEmpty = rooms.length === 0;
    const hasSearchResults = filteredRooms.length > 0 || !searchQuery.trim();
    const showConnectionError = !isConnected;

    return {
        // Data
        rooms,
        filteredRooms,
        currentUsername,
        currentUserId,
        isConnected,

        // Search state
        searchQuery,
        setSearchQuery,
        clearSearch,

        // Loading states
        isLoading,
        isSettingUsername,
        showUsernameSetup,

        // Actions
        handleSetUsername,
        handleRetryConnection,

        // Computed states
        isEmpty,
        hasSearchResults,
        showConnectionError,
    };
}
