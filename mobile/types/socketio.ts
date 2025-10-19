import { RoomEvent } from './server/RoomEvent';
import { SendEventPayload } from './server/SendEventPayload';
import { JoinRoomPayload } from './server/JoinRoomPayload';
import { LeaveRoomPayload } from './server/LeaveRoomPayload';
import { CreateRoomPayload } from './server/CreateRoomPayload';
import { RoomListResponse } from './server/RoomListResponse';
import { SetUsernamePayload } from './server/SetUsernamePayload';
import { GetMembersPayload } from './server/GetMembersPayload';
import { RoomMembersResponse } from './server/RoomMembersResponse';
import { StartTypingPayload } from './server/StartTypingPayload';
import { StopTypingPayload } from './server/StopTypingPayload';
import { TypingIndicator } from './server/TypingIndicator';

export interface ServerToClientEvents {
    'room.event': (event: RoomEvent) => void;
    'room.list': (response: RoomListResponse) => void;
    'username.set': (username: string) => void;
    'room.members': (response: RoomMembersResponse) => void;
    'typing.start': (indicator: TypingIndicator) => void;
    'typing.stop': (indicator: TypingIndicator) => void;
}

export interface ClientToServerEvents {
    'room.send': (payload: SendEventPayload) => void;
    'room.join': (payload: JoinRoomPayload) => void;
    'room.leave': (payload: LeaveRoomPayload) => void;
    'room.list': () => void;
    'room.create': (payload: CreateRoomPayload) => void;
    'user.set_username': (payload: SetUsernamePayload) => void;
    'room.get_members': (payload: GetMembersPayload) => void;
    'typing.start': (payload: StartTypingPayload) => void;
    'typing.stop': (payload: StopTypingPayload) => void;
}
