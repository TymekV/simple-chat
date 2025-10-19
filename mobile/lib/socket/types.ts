import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socketio';
import type { RoomEvent } from '@/types/server/RoomEvent';
import type { RoomListItem } from '@/types/server/RoomListItem';
import type { RoomMember } from '@/types/server/RoomMember';
import type { TypingIndicator } from '@/types/server/TypingIndicator';

export type SocketInstance = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface SocketState {
    isConnected: boolean;
    socket: SocketInstance | null;
    currentUserId: string | null;
}

export interface RoomState {
    currentRoom: string | null;
    messages: RoomEvent[];
    rooms: RoomListItem[];
    roomMembers: RoomMember[];
}

export interface UserState {
    currentUsername: string | null;
}

export interface TypingState {
    typingUsers: Map<string, TypingIndicator[]>;
}

export interface SocketContextValue extends SocketState, RoomState, UserState, TypingState {
    // Room actions
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
    loadRoomList: () => void;
    createRoom: (name: string) => void;
    getRoomMembers: (roomId: string) => void;

    // Message actions
    sendMessage: (payload: import('@/types/server/SendEventPayload').SendEventPayload) => void;
    editMessage: (roomId: string, messageId: string, newContent: string) => void;
    deleteMessage: (roomId: string, messageId: string) => void;

    // User actions
    setUsername: (username: string) => void;

    // Typing actions
    startTyping: (roomId: string) => void;
    stopTyping: (roomId: string) => void;
}

export interface SocketEventHandlers {
    onConnect: (socketId: string) => void;
    onDisconnect: (reason: string) => void;
    onConnectError: (error: Error) => void;
    onRoomEvent: (event: RoomEvent) => void;
    onRoomList: (response: import('@/types/server/RoomListResponse').RoomListResponse) => void;
    onUsernameSet: (username: string) => void;
    onRoomMembers: (response: import('@/types/server/RoomMembersResponse').RoomMembersResponse) => void;
    onTypingStart: (indicator: TypingIndicator) => void;
    onTypingStop: (indicator: TypingIndicator) => void;
}

export interface UseRoomReturn {
    messages: RoomEvent[];
    sendMessage: (messageData: import('@/types/server/RoomEventData').RoomEventData) => void;
    isConnected: boolean;
    isInRoom: boolean;
    typingUsers: TypingIndicator[];
    startTyping: () => void;
    stopTyping: () => void;
    editMessage: (messageId: string, newContent: string) => void;
    deleteMessage: (messageId: string) => void;
}
