import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socketio';
import type { RoomEvent } from '@/types/server/RoomEvent';
import type { SendEventPayload } from '@/types/server/SendEventPayload';
import type { RoomEventData } from '@/types/server/RoomEventData';
import type { RoomListItem } from '@/types/server/RoomListItem';
import type { CreateRoomPayload } from '@/types/server/CreateRoomPayload';

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
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

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
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
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

        newSocket.on('room.created', (event) => {
            console.log('Room created:', event.room.name);
            setRooms((prevRooms) => [...prevRooms, event.room]);
        });

        return () => {
            console.log('Cleaning up socket connection');
            newSocket.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
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
            console.log('Socket connected, loading room list');
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
            console.log('Creating room:', name);
            if (socket && isConnected) {
                socket.emit('room.create', { name });
            } else {
                console.warn('Cannot create room: not connected');
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
    const { sendMessage, messages, currentRoom, isConnected, joinRoom, leaveRoom } = useSocket();

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

    return {
        messages: currentRoom === roomId ? messages : [],
        sendMessage: sendRoomMessage,
        isConnected,
        isInRoom: currentRoom === roomId,
    };
}
