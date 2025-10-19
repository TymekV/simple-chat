import { useCallback, useRef } from 'react';
import type { SocketInstance, SocketEventHandlers } from './types';
import type { RoomEvent } from '@/types/server/RoomEvent';
import type { RoomListResponse } from '@/types/server/RoomListResponse';
import type { RoomMembersResponse } from '@/types/server/RoomMembersResponse';
import type { TypingIndicator } from '@/types/server/TypingIndicator';

interface UseSocketEventsOptions {
    socket: SocketInstance | null;
    handlers: SocketEventHandlers;
}

interface UseSocketEventsReturn {
    attachEventListeners: () => void;
    detachEventListeners: () => void;
}

export function useSocketEvents({
    socket,
    handlers,
}: UseSocketEventsOptions): UseSocketEventsReturn {
    const listenersAttachedRef = useRef(false);

    const attachEventListeners = useCallback(() => {
        if (!socket || listenersAttachedRef.current) {
            return;
        }

        console.log('Attaching socket event listeners');

        // Connection events
        socket.on('connect', () => {
            handlers.onConnect(socket.id!);
        });

        socket.on('disconnect', (reason) => {
            handlers.onDisconnect(reason);
        });

        socket.on('connect_error', (error) => {
            handlers.onConnectError(error);
        });

        // Room events
        socket.on('room.event', (event: RoomEvent) => {
            handlers.onRoomEvent(event);
        });

        socket.on('room.list', (response: RoomListResponse) => {
            handlers.onRoomList(response);
        });

        socket.on('room.members', (response: RoomMembersResponse) => {
            handlers.onRoomMembers(response);
        });

        // User events
        socket.on('username.set', (username: string) => {
            handlers.onUsernameSet(username);
        });

        // Typing events
        socket.on('typing.start', (indicator: TypingIndicator) => {
            handlers.onTypingStart(indicator);
        });

        socket.on('typing.stop', (indicator: TypingIndicator) => {
            handlers.onTypingStop(indicator);
        });

        listenersAttachedRef.current = true;
    }, [socket, handlers]);

    const detachEventListeners = useCallback(() => {
        if (!socket || !listenersAttachedRef.current) {
            return;
        }

        console.log('Detaching socket event listeners');

        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('room.event');
        socket.off('room.list');
        socket.off('room.members');
        socket.off('username.set');
        socket.off('typing.start');
        socket.off('typing.stop');

        listenersAttachedRef.current = false;
    }, [socket]);

    return {
        attachEventListeners,
        detachEventListeners,
    };
}
