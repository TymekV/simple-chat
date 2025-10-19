import { useState, useCallback } from 'react';
import type { RoomEvent } from '@/types/server/RoomEvent';
import type { RoomListItem } from '@/types/server/RoomListItem';
import type { RoomMember } from '@/types/server/RoomMember';
import type { RoomState } from './types';

interface UseRoomStateReturn extends RoomState {
    addMessage: (event: RoomEvent) => void;
    updateMessage: (messageId: string, updater: (event: RoomEvent) => RoomEvent) => void;
    clearMessages: () => void;
    setCurrentRoom: (roomId: string | null) => void;
    updateRooms: (rooms: RoomListItem[]) => void;
    updateRoomMembers: (members: RoomMember[]) => void;
    handleMessageEdit: (messageId: string, newContent: string) => void;
    handleMessageDelete: (messageId: string) => void;
}

export function useRoomState(): UseRoomStateReturn {
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [messages, setMessages] = useState<RoomEvent[]>([]);
    const [rooms, setRooms] = useState<RoomListItem[]>([]);
    const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);

    const addMessage = useCallback((event: RoomEvent) => {
        setMessages((prevMessages) => [...prevMessages, event]);
    }, []);

    const updateMessage = useCallback((messageId: string, updater: (event: RoomEvent) => RoomEvent) => {
        setMessages((prevMessages) =>
            prevMessages.map((msg) => {
                if (msg.id === messageId) {
                    return updater(msg);
                }
                return msg;
            })
        );
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const updateRooms = useCallback((newRooms: RoomListItem[]) => {
        setRooms(newRooms);
    }, []);

    const updateRoomMembers = useCallback((members: RoomMember[]) => {
        setRoomMembers(members);
    }, []);

    const handleMessageEdit = useCallback((messageId: string, newContent: string) => {
        updateMessage(messageId, (msg) => {
            if ('Message' in msg.data) {
                return {
                    ...msg,
                    data: {
                        Message: {
                            ...msg.data.Message,
                            content: newContent,
                            edited: true,
                        },
                    },
                };
            }
            return msg;
        });
    }, [updateMessage]);

    const handleMessageDelete = useCallback((messageId: string) => {
        updateMessage(messageId, (msg) => {
            if ('Message' in msg.data) {
                return {
                    ...msg,
                    data: {
                        Message: {
                            ...msg.data.Message,
                            content: '',
                            deleted: true,
                        },
                    },
                };
            }
            return msg;
        });
    }, [updateMessage]);

    return {
        currentRoom,
        messages,
        rooms,
        roomMembers,
        addMessage,
        updateMessage,
        clearMessages,
        setCurrentRoom,
        updateRooms,
        updateRoomMembers,
        handleMessageEdit,
        handleMessageDelete,
    };
}
