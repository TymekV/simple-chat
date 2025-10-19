import { useEffect, useCallback } from 'react';
import { useSocket } from './SocketProvider';
import type { UseRoomReturn } from './types';
import type { RoomEventData } from '@/types/server/RoomEventData';
import type { SendEventPayload } from '@/types/server/SendEventPayload';

export function useRoom(roomId: string): UseRoomReturn {
    const {
        sendMessage,
        messages,
        currentRoom,
        isConnected,
        joinRoom,
        leaveRoom,
        typingUsers,
        startTyping,
        stopTyping,
        editMessage,
        deleteMessage,
        currentUserId,
    } = useSocket();

    useEffect(() => {
        if (roomId && isConnected) {
            console.log(`useRoom: Joining room ${roomId}`);
            joinRoom(roomId);

            return () => {
                console.log(`useRoom: Leaving room ${roomId}`);
                leaveRoom(roomId);
            };
        }
    }, [roomId, isConnected, joinRoom, leaveRoom]);

    const sendRoomMessage = useCallback(
        (messageData: RoomEventData) => {
            const payload: SendEventPayload = {
                room: roomId,
                payload: messageData,
            };
            sendMessage(payload);
        },
        [roomId, sendMessage]
    );

    const roomTypingUsers = typingUsers.get(roomId) || [];
    const otherUsersTyping = roomTypingUsers.filter(
        (indicator) => indicator.user_id !== currentUserId
    );

    const startTypingInRoom = useCallback(() => {
        startTyping(roomId);
    }, [startTyping, roomId]);

    const stopTypingInRoom = useCallback(() => {
        stopTyping(roomId);
    }, [stopTyping, roomId]);

    const editRoomMessage = useCallback(
        (messageId: string, newContent: string) => {
            editMessage(roomId, messageId, newContent);
        },
        [editMessage, roomId]
    );

    const deleteRoomMessage = useCallback(
        (messageId: string) => {
            deleteMessage(roomId, messageId);
        },
        [deleteMessage, roomId]
    );

    return {
        messages: currentRoom === roomId ? messages : [],
        sendMessage: sendRoomMessage,
        isConnected,
        isInRoom: currentRoom === roomId,
        typingUsers: otherUsersTyping,
        startTyping: startTypingInRoom,
        stopTyping: stopTypingInRoom,
        editMessage: editRoomMessage,
        deleteMessage: deleteRoomMessage,
    };
}
