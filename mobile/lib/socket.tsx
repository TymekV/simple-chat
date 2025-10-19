import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socketio';
import type { RoomEvent } from '@/types/server/RoomEvent';
import type { SendEventPayload } from '@/types/server/SendEventPayload';
import type { RoomEventData } from '@/types/server/RoomEventData';
import type { RoomListItem } from '@/types/server/RoomListItem';
import type { SetUsernamePayload } from '@/types/server/SetUsernamePayload';
import type { GetMembersPayload } from '@/types/server/GetMembersPayload';
import type { RoomMembersResponse } from '@/types/server/RoomMembersResponse';
import type { RoomMember } from '@/types/server/RoomMember';
import type { StartTypingPayload } from '@/types/server/StartTypingPayload';
import type { StopTypingPayload } from '@/types/server/StopTypingPayload';
import type { TypingIndicator } from '@/types/server/TypingIndicator';

interface SocketContextValue {
    isConnected: boolean;
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    sendMessage: (payload: SendEventPayload) => void;
    messages: RoomEvent[];
    currentRoom: string | null;
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
    rooms: RoomListItem[];
    loadRoomList: () => void;
    createRoom: (name: string) => void;
    currentUserId: string | null;
    setUsername: (username: string) => void;
    currentUsername: string | null;
    getRoomMembers: (roomId: string) => void;
    roomMembers: RoomMember[];
    typingUsers: Map<string, TypingIndicator[]>;
    startTyping: (roomId: string) => void;
    stopTyping: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
    children: React.ReactNode;
    serverUrl?: string;
}

export function SocketProvider({
    children,
    serverUrl = 'http://192.168.1.252:3002',
}: SocketProviderProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(
        null
    );
    const [messages, setMessages] = useState<RoomEvent[]>([]);
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [rooms, setRooms] = useState<RoomListItem[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);
    const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
    const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator[]>>(new Map());
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('GLOBAL: Socket connected:', newSocket.id);
            setIsConnected(true);
            setCurrentUserId(newSocket.id!);
            console.log('GLOBAL: Requesting room list on connect');
            newSocket.emit('room.list');
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
            setCurrentUserId(null);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        newSocket.on('room.event', (event: RoomEvent) => {
            console.log('Received room event:', event);
            setMessages((prevMessages) => [...prevMessages, event]);
        });

        newSocket.on('room.list', (response) => {
            console.log('Received room list with', response.rooms.length, 'rooms');
            setRooms(response.rooms);
        });

        newSocket.on('username.set', (username: string) => {
            console.log('Username set confirmed:', username);
            setCurrentUsername(username);
        });

        newSocket.on('room.members', (response: RoomMembersResponse) => {
            console.log('Received room members:', response.members);
            setRoomMembers(response.members);
        });

        newSocket.on('typing.start', (indicator: TypingIndicator) => {
            console.log('User started typing:', indicator);
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

            // Clear existing timeout for this user
            const timeoutKey = `${indicator.room_id}-${indicator.user_id}`;
            const existingTimeout = typingTimeoutsRef.current.get(timeoutKey);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            // Set new timeout to auto-remove typing indicator after 3 seconds
            const timeout = setTimeout(() => {
                setTypingUsers((prev) => {
                    const newMap = new Map(prev);
                    const roomTypers = newMap.get(indicator.room_id) || [];
                    const filteredTypers = roomTypers.filter(
                        (t) => t.user_id !== indicator.user_id
                    );

                    if (filteredTypers.length === 0) {
                        newMap.delete(indicator.room_id);
                    } else {
                        newMap.set(indicator.room_id, filteredTypers);
                    }

                    return newMap;
                });
                typingTimeoutsRef.current.delete(timeoutKey);
            }, 3000);

            typingTimeoutsRef.current.set(timeoutKey, timeout);
        });

        newSocket.on('typing.stop', (indicator: TypingIndicator) => {
            console.log('User stopped typing:', indicator);
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
        });

        return () => {
            console.log('Cleaning up socket connection');
            newSocket.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
            setCurrentUserId(null);

            // Clear all typing timeouts
            typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
            typingTimeoutsRef.current.clear();
            setTypingUsers(new Map());
        };
    }, [serverUrl]);

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
            setCurrentRoom(roomId);
            setMessages([]);
        },
        [socket, isConnected]
    );

    const startTyping = useCallback(
        (roomId: string) => {
            if (socket && isConnected) {
                const payload: StartTypingPayload = { room_id: roomId };
                socket.emit('typing.start', payload);
            }
        },
        [socket, isConnected]
    );

    const stopTyping = useCallback(
        (roomId: string) => {
            if (socket && isConnected) {
                const payload: StopTypingPayload = { room_id: roomId };
                socket.emit('typing.stop', payload);
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
            }
            setCurrentRoom(null);
            setMessages([]);
        },
        [socket, isConnected]
    );

    const sendMessage = useCallback(
        (payload: SendEventPayload) => {
            if (socket && isConnected) {
                socket.emit('room.send', payload);
            } else {
                console.warn('Cannot send message: not connected');
            }
        },
        [socket, isConnected]
    );

    useEffect(() => {
        if (socket && isConnected) {
            socket.emit('room.list');
        }
    }, [socket, isConnected]);

    const loadRoomList = useCallback(() => {
        if (socket && isConnected) {
            socket.emit('room.list');
        } else {
            console.warn('Cannot load room list: not connected');
        }
    }, [socket, isConnected]);

    const createRoom = useCallback(
        (name: string) => {
            if (socket && isConnected) {
                socket.emit('room.create', { name });
            }
        },
        [socket, isConnected]
    );

    const setUsername = useCallback(
        (username: string) => {
            if (socket && isConnected) {
                const payload: SetUsernamePayload = { username };
                socket.emit('user.set_username', payload);
            }
        },
        [socket, isConnected]
    );

    const getRoomMembers = useCallback(
        (roomId: string) => {
            if (socket && isConnected) {
                const payload: GetMembersPayload = { room_id: roomId };
                socket.emit('room.get_members', payload);
            }
        },
        [socket, isConnected]
    );

    const value: SocketContextValue = {
        isConnected,
        socket,
        sendMessage,
        messages,
        currentRoom,
        joinRoom,
        leaveRoom,
        rooms,
        loadRoomList,
        createRoom,
        currentUserId,
        setUsername,
        currentUsername,
        getRoomMembers,
        roomMembers,
        typingUsers,
        startTyping,
        stopTyping,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}

export function useRoom(roomId: string) {
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
        currentUserId,
    } = useSocket();

    useEffect(() => {
        if (roomId && isConnected) {
            joinRoom(roomId);

            return () => {
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

    return {
        messages: currentRoom === roomId ? messages : [],
        sendMessage: sendRoomMessage,
        isConnected,
        isInRoom: currentRoom === roomId,
        typingUsers: otherUsersTyping,
        startTyping: startTypingInRoom,
        stopTyping: stopTypingInRoom,
    };
}
