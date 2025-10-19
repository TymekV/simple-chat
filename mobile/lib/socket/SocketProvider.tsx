import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useSocketConnection } from './useSocketConnection';
import { useSocketEvents } from './useSocketEvents';
import { useRoomState } from './useRoomState';
import { useTypingState } from './useTypingState';
import { useSocketActions } from './useSocketActions';
import type { SocketContextValue, SocketEventHandlers } from './types';
import type { RoomEvent } from '@/types/server/RoomEvent';
import type { RoomListResponse } from '@/types/server/RoomListResponse';
import type { RoomMembersResponse } from '@/types/server/RoomMembersResponse';
import type { TypingIndicator } from '@/types/server/TypingIndicator';

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
    children: React.ReactNode;
    serverUrl?: string;
}

export function SocketProvider({
    children,
    serverUrl = 'http://192.168.1.252:3002',
}: SocketProviderProps) {
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);

    // Initialize socket connection
    const { isConnected, socket, currentUserId } = useSocketConnection({
        serverUrl,
    });

    // Initialize room state
    const {
        currentRoom,
        messages,
        rooms,
        roomMembers,
        addMessage,
        clearMessages,
        setCurrentRoom,
        updateRooms,
        updateRoomMembers,
        handleMessageEdit,
        handleMessageDelete,
    } = useRoomState();

    // Initialize typing state
    const { typingUsers, addTypingUser, removeTypingUser, clearTypingUsers } = useTypingState();

    // Initialize socket actions
    const socketActions = useSocketActions({
        socket,
        isConnected,
    });

    // Event handlers
    const eventHandlers: SocketEventHandlers = useMemo(
        () => ({
            onConnect: (socketId: string) => {
                console.log('GLOBAL: Socket connected:', socketId);
                // Request room list on connect
                console.log('GLOBAL: Requesting room list on connect');
                socketActions.loadRoomList();
            },

            onDisconnect: (reason: string) => {
                console.log('Socket disconnected:', reason);
                setCurrentUsername(null);
            },

            onConnectError: (error: Error) => {
                console.error('Socket connection error:', error);
            },

            onRoomEvent: (event: RoomEvent) => {
                console.log('Received room event:', event);

                if ('MessageEdit' in event.data) {
                    const editEvent = event.data.MessageEdit;
                    handleMessageEdit(editEvent.message_id, editEvent.new_content);
                } else if ('MessageDelete' in event.data) {
                    const deleteEvent = event.data.MessageDelete;
                    handleMessageDelete(deleteEvent.message_id);
                } else {
                    addMessage(event);
                }
            },

            onRoomList: (response: RoomListResponse) => {
                console.log('Received room list with', response.rooms.length, 'rooms');
                updateRooms(response.rooms);
            },

            onUsernameSet: (username: string) => {
                console.log('Username set confirmed:', username);
                setCurrentUsername(username);
            },

            onRoomMembers: (response: RoomMembersResponse) => {
                console.log('Received room members:', response.members);
                updateRoomMembers(response.members);
            },

            onTypingStart: (indicator: TypingIndicator) => {
                console.log('User started typing:', indicator);
                addTypingUser(indicator);
            },

            onTypingStop: (indicator: TypingIndicator) => {
                console.log('User stopped typing:', indicator);
                removeTypingUser(indicator);
            },
        }),
        [
            socketActions,
            handleMessageEdit,
            handleMessageDelete,
            addMessage,
            updateRooms,
            updateRoomMembers,
            addTypingUser,
            removeTypingUser,
        ]
    );

    // Attach event listeners
    const { attachEventListeners, detachEventListeners } = useSocketEvents({
        socket,
        handlers: eventHandlers,
    });

    useEffect(() => {
        if (socket && isConnected) {
            attachEventListeners();
            return detachEventListeners;
        }
    }, [socket, isConnected, attachEventListeners, detachEventListeners]);

    // Enhanced room actions that include state management
    const joinRoom = useCallback(
        (roomId: string) => {
            socketActions.joinRoom(roomId);
            setCurrentRoom(roomId);
            clearMessages();
        },
        [socketActions.joinRoom, clearMessages]
    );

    const leaveRoom = useCallback(
        (roomId: string) => {
            socketActions.leaveRoom(roomId);
            setCurrentRoom(null);
            clearMessages();
        },
        [socketActions.leaveRoom, clearMessages]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTypingUsers();
        };
    }, [clearTypingUsers]);

    const contextValue: SocketContextValue = {
        // Socket state
        isConnected,
        socket,
        currentUserId,

        // Room state
        currentRoom,
        messages,
        rooms,
        roomMembers,

        // User state
        currentUsername,

        // Typing state
        typingUsers,

        // Enhanced actions
        joinRoom,
        leaveRoom,
        loadRoomList: socketActions.loadRoomList,
        createRoom: socketActions.createRoom,
        getRoomMembers: socketActions.getRoomMembers,
        sendMessage: socketActions.sendMessage,
        editMessage: socketActions.editMessage,
        deleteMessage: socketActions.deleteMessage,
        setUsername: socketActions.setUsername,
        startTyping: socketActions.startTyping,
        stopTyping: socketActions.stopTyping,
    };

    return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
