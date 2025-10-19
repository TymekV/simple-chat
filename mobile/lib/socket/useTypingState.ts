import { useState, useCallback, useRef, useEffect } from 'react';
import type { TypingIndicator } from '@/types/server/TypingIndicator';
import type { TypingState } from './types';

interface UseTypingStateReturn extends TypingState {
    addTypingUser: (indicator: TypingIndicator) => void;
    removeTypingUser: (indicator: TypingIndicator) => void;
    clearTypingUsers: () => void;
    getTypingUsersForRoom: (roomId: string) => TypingIndicator[];
    clearAllTypingTimeouts: () => void;
}

export function useTypingState(): UseTypingStateReturn {
    const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator[]>>(new Map());
    const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const addTypingUser = useCallback((indicator: TypingIndicator) => {
        setTypingUsers((prev) => {
            const newMap = new Map(prev);
            const roomTypers = newMap.get(indicator.room_id) || [];
            const existingIndex = roomTypers.findIndex((t) => t.user_id === indicator.user_id);

            if (existingIndex === -1) {
                roomTypers.push(indicator);
            } else {
                roomTypers[existingIndex] = indicator;
            }

            newMap.set(indicator.room_id, roomTypers);
            return newMap;
        });

        const timeoutKey = `${indicator.room_id}-${indicator.user_id}`;
        const existingTimeout = typingTimeoutsRef.current.get(timeoutKey);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Set new timeout to auto-remove typing indicator after 3 seconds
        const timeout = setTimeout(() => {
            removeTypingUser(indicator);
            typingTimeoutsRef.current.delete(timeoutKey);
        }, 3000);

        typingTimeoutsRef.current.set(timeoutKey, timeout);
    }, []);

    const removeTypingUser = useCallback((indicator: TypingIndicator) => {
        const timeoutKey = `${indicator.room_id}-${indicator.user_id}`;
        const existingTimeout = typingTimeoutsRef.current.get(timeoutKey);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingTimeoutsRef.current.delete(timeoutKey);
        }

        setTypingUsers((prev) => {
            const newMap = new Map(prev);
            const roomTypers = newMap.get(indicator.room_id) || [];
            const filteredTypers = roomTypers.filter((t) => t.user_id !== indicator.user_id);

            if (filteredTypers.length === 0) {
                newMap.delete(indicator.room_id);
            } else {
                newMap.set(indicator.room_id, filteredTypers);
            }

            return newMap;
        });
    }, []);

    const clearTypingUsers = useCallback(() => {
        typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        typingTimeoutsRef.current.clear();

        setTypingUsers(new Map());
    }, []);

    const getTypingUsersForRoom = useCallback(
        (roomId: string): TypingIndicator[] => {
            return typingUsers.get(roomId) || [];
        },
        [typingUsers]
    );

    const clearAllTypingTimeouts = useCallback(() => {
        typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        typingTimeoutsRef.current.clear();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTypingTimeouts();
        };
    }, [clearAllTypingTimeouts]);

    return {
        typingUsers,
        addTypingUser,
        removeTypingUser,
        clearTypingUsers,
        getTypingUsersForRoom,
        clearAllTypingTimeouts,
    };
}
