import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socketio';
import type { RoomEvent } from '@/types/server/RoomEvent';
import type { SendEventPayload } from '@/types/server/SendEventPayload';
import type { RoomEventData } from '@/types/server/RoomEventData';

interface SocketContextValue {
    isConnected: boolean;
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    sendMessage: (payload: SendEventPayload) => void;
    messages: RoomEvent[];
    currentRoom: string | null;
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
    children: React.ReactNode;
    serverUrl?: string;
}

export function SocketProvider({
    children,
    serverUrl = 'http://localhost:3002',
}: SocketProviderProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(
        null
    );
    const [messages, setMessages] = useState<RoomEvent[]>([]);
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
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

        // Room event handler
        newSocket.on('room.event', (event: RoomEvent) => {
            console.log('Received room event:', event);
            setMessages((prevMessages) => [...prevMessages, event]);
        });

        return () => {
            console.log('Cleaning up socket connection');
            newSocket.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
        };
    }, [serverUrl]);

    const joinRoom = (roomId: string) => {
        console.log(`Joining room: ${roomId}`);
        setCurrentRoom(roomId);
        setMessages([]);
    };

    const leaveRoom = (roomId: string) => {
        console.log(`Leaving room: ${roomId}`);
        setCurrentRoom(null);
        setMessages([]);
    };

    const sendMessage = (payload: SendEventPayload) => {
        if (socket && isConnected) {
            console.log('Sending message:', payload);
            socket.emit('room.send', payload);
        } else {
            console.warn('Cannot send message: socket not connected');
        }
    };

    const value: SocketContextValue = {
        isConnected,
        socket,
        sendMessage,
        messages,
        currentRoom,
        joinRoom,
        leaveRoom,
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

    const sendRoomMessage = (messageData: RoomEventData) => {
        const payload: SendEventPayload = {
            room: roomId,
            payload: messageData,
        };
        sendMessage(payload);
    };

    return {
        messages: currentRoom === roomId ? messages : [],
        sendMessage: sendRoomMessage,
        isConnected,
        isInRoom: currentRoom === roomId,
    };
}
