use serde::{Deserialize, Serialize};
use socketioxide::{
    SocketIo,
    extract::{Data, SocketRef, State},
};
use std::collections::HashSet;
use ts_rs::TS;
use uuid::Uuid;

use crate::{models::Room, state::AppState};

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct JoinRoomPayload {
    pub room_id: Uuid,
    pub room_name: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct LeaveRoomPayload {
    pub room_id: Uuid,
}

pub async fn join_room(
    s: SocketRef,
    _io: SocketIo,
    Data(data): Data<JoinRoomPayload>,
    State(state): State<AppState>,
) {
    println!("User {} joining room: {}", s.id, data.room_id);

    // Create room if it doesn't exist
    if !state.rooms.contains_key(&data.room_id) {
        let room = Room {
            id: data.room_id,
            name: data
                .room_name
                .unwrap_or_else(|| format!("Room {}", data.room_id)),
            members: HashSet::new(),
            events: Vec::new(),
        };
        state.rooms.insert(data.room_id, room);
        println!("Created new room: {}", data.room_id);
    }

    // Add user to room
    if let Some(mut room) = state.rooms.get_mut(&data.room_id) {
        room.members.insert(s.id);
        println!(
            "User {} joined room {} ({} members)",
            s.id,
            data.room_id,
            room.members.len()
        );
    }

    // Join socket to room for broadcasting
    s.join(data.room_id.to_string());

    // Send existing messages to the newly joined user
    if let Some(room) = state.rooms.get(&data.room_id) {
        for event in &room.events {
            if let Err(e) = s.emit("room.event", event) {
                eprintln!("Failed to send event to user: {}", e);
            }
        }
    }
}

pub async fn leave_room(
    s: SocketRef,
    _io: SocketIo,
    Data(data): Data<LeaveRoomPayload>,
    State(state): State<AppState>,
) {
    println!("User {} leaving room: {}", s.id, data.room_id);

    // Remove user from room
    if let Some(mut room) = state.rooms.get_mut(&data.room_id) {
        room.members.remove(&s.id);
        println!(
            "User {} left room {} ({} members remaining)",
            s.id,
            data.room_id,
            room.members.len()
        );
    }

    // Leave socket room
    s.leave(data.room_id.to_string());
}
