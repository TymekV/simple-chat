import { RoomEvent } from './server/RoomEvent';
import { SendEventPayload } from './server/SendEventPayload';

export interface ServerToClientEvents {
    'room.event': (event: RoomEvent) => void;
}

export interface ClientToServerEvents {
    'room.send': (payload: SendEventPayload) => void;
}
