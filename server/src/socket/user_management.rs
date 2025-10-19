use serde::{Deserialize, Serialize};
use socketioxide::{
    SocketIo,
    extract::{Data, SocketRef, State},
};
use ts_rs::TS;
use uuid::Uuid;

use crate::{
    models::{
        RoomEvent, RoomEventData, RoomMember, RoomMembersResponse, UserJoinEvent, UserLeaveEvent,
    },
    state::AppState,
};

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct SetUsernamePayload {
    pub username: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct GetMembersPayload {
    pub room_id: Uuid,
}

pub async fn set_username(
    s: SocketRef,
    Data(data): Data<SetUsernamePayload>,
    State(state): State<AppState>,
) {
    println!("User {} setting username to: {}", s.id, data.username);

    // Store username in state
    state.usernames.insert(s.id, data.username.clone());

    // Emit success response
    if let Err(e) = s.emit("username.set", &data.username) {
        eprintln!("Failed to confirm username set: {}", e);
    }
}

pub async fn get_room_members(
    s: SocketRef,
    Data(data): Data<GetMembersPayload>,
    State(state): State<AppState>,
) {
    if let Some(room) = state.rooms.get(&data.room_id) {
        let members: Vec<RoomMember> = room
            .members
            .iter()
            .map(|member_id| {
                let username = state.usernames.get(member_id).map(|u| u.clone());
                RoomMember {
                    user_id: *member_id,
                    username,
                }
            })
            .collect();

        let response = RoomMembersResponse { members };

        if let Err(e) = s.emit("room.members", &response) {
            eprintln!("Failed to send room members: {}", e);
        }

        println!(
            "Sent {} members for room {}",
            response.members.len(),
            data.room_id
        );
    } else {
        println!("Room {} not found", data.room_id);
    }
}

pub async fn handle_user_join_room(s: SocketRef, io: SocketIo, room_id: Uuid, state: AppState) {
    let username = state.usernames.get(&s.id).map(|u| u.clone());

    let join_event = RoomEvent {
        id: Uuid::new_v4(),
        from: s.id,
        timestamp: chrono::Utc::now(),
        data: RoomEventData::UserJoin(UserJoinEvent {
            user_id: s.id,
            username: username.clone(),
        }),
    };

    if let Some(mut room) = state.rooms.get_mut(&room_id) {
        room.events.push(join_event.clone());
    }

    if let Err(e) = io
        .to(room_id.to_string())
        .emit("room.event", &join_event)
        .await
    {
        println!("Failed to broadcast user join event: {}", e);
    }

    send_updated_members_to_room(&io, &state, room_id).await;

    println!("User {} ({:?}) joined room {}", s.id, username, room_id);
}

pub async fn handle_user_leave_room(s: SocketRef, io: SocketIo, room_id: Uuid, state: AppState) {
    let username = state.usernames.get(&s.id).map(|u| u.clone());

    // Create user leave event
    let leave_event = RoomEvent {
        id: Uuid::new_v4(),
        from: s.id,
        timestamp: chrono::Utc::now(),
        data: RoomEventData::UserLeave(UserLeaveEvent {
            user_id: s.id,
            username: username.clone(),
        }),
    };

    if let Some(mut room) = state.rooms.get_mut(&room_id) {
        room.events.push(leave_event.clone());
    }

    if let Err(e) = io
        .to(room_id.to_string())
        .emit("room.event", &leave_event)
        .await
    {
        println!("Failed to broadcast user leave event: {}", e);
    }

    send_updated_members_to_room(&io, &state, room_id).await;

    println!("User {} ({:?}) left room {}", s.id, username, room_id);
}

async fn send_updated_members_to_room(io: &SocketIo, state: &AppState, room_id: Uuid) {
    if let Some(room) = state.rooms.get(&room_id) {
        let members: Vec<RoomMember> = room
            .members
            .iter()
            .map(|member_id| {
                let username = state.usernames.get(member_id).map(|u| u.clone());
                RoomMember {
                    user_id: *member_id,
                    username,
                }
            })
            .collect();

        let response = RoomMembersResponse { members };

        if let Err(e) = io
            .to(room_id.to_string())
            .emit("room.members", &response)
            .await
        {
            println!("Failed to broadcast updated room members: {}", e);
        }
    }
}

pub async fn handle_disconnect(s: SocketRef, io: SocketIo, state: AppState) {
    println!("User {} disconnecting, cleaning up from all rooms", s.id);

    let rooms_to_leave: Vec<Uuid> = state
        .rooms
        .iter()
        .filter_map(|entry| {
            let (room_id, room) = entry.pair();
            if room.members.contains(&s.id) {
                Some(*room_id)
            } else {
                None
            }
        })
        .collect();

    for room_id in rooms_to_leave {
        if let Some(mut room) = state.rooms.get_mut(&room_id) {
            room.members.remove(&s.id);
        }

        handle_user_leave_room(s.clone(), io.clone(), room_id, state.clone()).await;
    }

    state.usernames.remove(&s.id);

    println!("Cleanup completed for disconnected user {}", s.id);
}
