import { RoomEvent } from './server/RoomEvent';
import { SendEventPayload } from './server/SendEventPayload';

export interface JoinRoomPayload {
    room_id: string;
    room_name?: string | null;
}

export interface LeaveRoomPayload {
    room_id: string;
}

export interface ServerToClientEvents {
    'room.event': (event: RoomEvent) => void;
}

export interface ClientToServerEvents {
    'room.send': (payload: SendEventPayload) => void;
    'room.join': (payload: JoinRoomPayload) => void;
    'room.leave': (payload: LeaveRoomPayload) => void;
}
