import { useCallback } from 'react';
import type { SocketInstance } from './types';
import type { SendEventPayload } from '@/types/server/SendEventPayload';
import type { SetUsernamePayload } from '@/types/server/SetUsernamePayload';
import type { GetMembersPayload } from '@/types/server/GetMembersPayload';
import type { StartTypingPayload } from '@/types/server/StartTypingPayload';
import type { StopTypingPayload } from '@/types/server/StopTypingPayload';
import type { EditMessagePayload } from '@/types/server/EditMessagePayload';
import type { DeleteMessagePayload } from '@/types/server/DeleteMessagePayload';

interface UseSocketActionsOptions {
    socket: SocketInstance | null;
    isConnected: boolean;
}

interface UseSocketActionsReturn {
    // Room actions
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
    loadRoomList: () => void;
    createRoom: (name: string) => void;
    getRoomMembers: (roomId: string) => void;

    // Message actions
    sendMessage: (payload: SendEventPayload) => void;
    editMessage: (roomId: string, messageId: string, newContent: string) => void;
    deleteMessage: (roomId: string, messageId: string) => void;

    // User actions
    setUsername: (username: string) => void;

    // Typing actions
    startTyping: (roomId: string) => void;
    stopTyping: (roomId: string) => void;
}

export function useSocketActions({
    socket,
    isConnected,
}: UseSocketActionsOptions): UseSocketActionsReturn {
    const joinRoom = useCallback(
        (roomId: string) => {
            console.log(`Joining room: ${roomId}`);
            if (socket && isConnected) {
                socket.emit('room.join', {
                    room_id: roomId,
                    room_name: null,
                });
            } else {
                console.warn('Cannot join room: not connected');
            }
        },
        [socket, isConnected]
    );

    const leaveRoom = useCallback(
        (roomId: string) => {
            console.log(`Leaving room: ${roomId}`);
            if (socket && isConnected) {
                socket.emit('room.leave', {
                    room_id: roomId,
                });
            } else {
                console.warn('Cannot leave room: not connected');
            }
        },
        [socket, isConnected]
    );

    const loadRoomList = useCallback(() => {
        if (socket && isConnected) {
            console.log('Loading room list');
            socket.emit('room.list');
        } else {
            console.warn('Cannot load room list: not connected');
        }
    }, [socket, isConnected]);

    const createRoom = useCallback(
        (name: string) => {
            if (socket && isConnected) {
                console.log(`Creating room: ${name}`);
                socket.emit('room.create', { name });
            } else {
                console.warn('Cannot create room: not connected');
            }
        },
        [socket, isConnected]
    );

    const getRoomMembers = useCallback(
        (roomId: string) => {
            if (socket && isConnected) {
                console.log(`Getting members for room: ${roomId}`);
                const payload: GetMembersPayload = { room_id: roomId };
                socket.emit('room.get_members', payload);
            } else {
                console.warn('Cannot get room members: not connected');
            }
        },
        [socket, isConnected]
    );

    const sendMessage = useCallback(
        (payload: SendEventPayload) => {
            if (socket && isConnected) {
                console.log('Sending message to room:', payload.room);
                socket.emit('room.send', payload);
            } else {
                console.warn('Cannot send message: not connected');
            }
        },
        [socket, isConnected]
    );

    const editMessage = useCallback(
        (roomId: string, messageId: string, newContent: string) => {
            if (socket && isConnected) {
                console.log(`Editing message ${messageId} in room ${roomId}`);
                const payload: EditMessagePayload = {
                    room: roomId,
                    message_id: messageId,
                    new_content: newContent,
                };
                socket.emit('message.edit', payload);
            } else {
                console.warn('Cannot edit message: not connected');
            }
        },
        [socket, isConnected]
    );

    const deleteMessage = useCallback(
        (roomId: string, messageId: string) => {
            if (socket && isConnected) {
                console.log(`Deleting message ${messageId} in room ${roomId}`);
                const payload: DeleteMessagePayload = {
                    room: roomId,
                    message_id: messageId,
                };
                socket.emit('message.delete', payload);
            } else {
                console.warn('Cannot delete message: not connected');
            }
        },
        [socket, isConnected]
    );

    const setUsername = useCallback(
        (username: string) => {
            if (socket && isConnected) {
                console.log(`Setting username: ${username}`);
                const payload: SetUsernamePayload = { username };
                socket.emit('user.set_username', payload);
            } else {
                console.warn('Cannot set username: not connected');
            }
        },
        [socket, isConnected]
    );

    const startTyping = useCallback(
        (roomId: string) => {
            if (socket && isConnected) {
                const payload: StartTypingPayload = { room_id: roomId };
                socket.emit('typing.start', payload);
            } else {
                console.warn('Cannot start typing: not connected');
            }
        },
        [socket, isConnected]
    );

    const stopTyping = useCallback(
        (roomId: string) => {
            if (socket && isConnected) {
                const payload: StopTypingPayload = { room_id: roomId };
                socket.emit('typing.stop', payload);
            } else {
                console.warn('Cannot stop typing: not connected');
            }
        },
        [socket, isConnected]
    );

    return {
        joinRoom,
        leaveRoom,
        loadRoomList,
        createRoom,
        getRoomMembers,
        sendMessage,
        editMessage,
        deleteMessage,
        setUsername,
        startTyping,
        stopTyping,
    };
}
