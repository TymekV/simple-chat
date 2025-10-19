import { RoomEvent } from './server/RoomEvent';
import { SendEventPayload } from './server/SendEventPayload';
import { JoinRoomPayload } from './server/JoinRoomPayload';
import { LeaveRoomPayload } from './server/LeaveRoomPayload';
import { CreateRoomPayload } from './server/CreateRoomPayload';
import { RoomListResponse } from './server/RoomListResponse';
import { RoomCreatedEvent } from './server/RoomCreatedEvent';

export interface ServerToClientEvents {
    'room.event': (event: RoomEvent) => void;
    'room.list': (response: RoomListResponse) => void;
    'room.created': (event: RoomCreatedEvent) => void;
}

export interface ClientToServerEvents {
    'room.send': (payload: SendEventPayload) => void;
    'room.join': (payload: JoinRoomPayload) => void;
    'room.leave': (payload: LeaveRoomPayload) => void;
    'room.list': () => void;
    'room.create': (payload: CreateRoomPayload) => void;
}
