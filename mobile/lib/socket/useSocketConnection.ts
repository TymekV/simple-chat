import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { SocketInstance, SocketState } from './types';

interface UseSocketConnectionOptions {
    serverUrl: string;
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
}

interface UseSocketConnectionReturn extends SocketState {
    connect: () => void;
    disconnect: () => void;
    reconnect: () => void;
}

export function useSocketConnection({
    serverUrl,
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
}: UseSocketConnectionOptions): UseSocketConnectionReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<SocketInstance | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const socketRef = useRef<SocketInstance | null>(null);

    const connect = useCallback(() => {
        if (socketRef.current?.connected) {
            console.log('Socket already connected');
            return;
        }

        console.log('Connecting to socket server:', serverUrl);

        const newSocket: SocketInstance = io(serverUrl, {
            autoConnect,
            reconnection,
            reconnectionAttempts,
            reconnectionDelay,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);
            setCurrentUserId(newSocket.id!);
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

        return newSocket;
    }, [serverUrl, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            console.log('Disconnecting socket');
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
            setCurrentUserId(null);
        }
    }, []);

    const reconnect = useCallback(() => {
        disconnect();
        setTimeout(() => {
            connect();
        }, 100);
    }, [disconnect, connect]);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        socket,
        currentUserId,
        connect,
        disconnect,
        reconnect,
    };
}
