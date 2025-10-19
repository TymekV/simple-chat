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
pub struct CreateRoomPayload {
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct RoomListItem {
    pub id: String,
    pub name: String,
    pub member_count: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct RoomListResponse {
    pub rooms: Vec<RoomListItem>,
}

pub async fn list_rooms(s: SocketRef, _io: SocketIo, State(state): State<AppState>) {
    println!("DEBUG: list_rooms called for user {}", s.id);
    println!("DEBUG: state.rooms contains {} entries", state.rooms.len());

    // Debug: Print all rooms in state
    for entry in state.rooms.iter() {
        let room = entry.value();
        println!("DEBUG: Room in state: {} - {}", room.id, room.name);
    }

    let rooms: Vec<RoomListItem> = state
        .rooms
        .iter()
        .map(|entry| {
            let room = entry.value();
            RoomListItem {
                id: room.id.to_string(),
                name: room.name.clone(),
                member_count: room.members.len(),
            }
        })
        .collect();

    let response = RoomListResponse { rooms };

    println!("DEBUG: Converted to {} room items", response.rooms.len());

    if let Err(e) = s.emit("room.list", &response) {
        println!("Failed to send room list to user {}: {}", s.id, e);
    } else {
        println!("Sent {} rooms to user {}", response.rooms.len(), s.id);
    }
}

pub async fn create_room(
    s: SocketRef,
    io: SocketIo,
    Data(data): Data<CreateRoomPayload>,
    State(state): State<AppState>,
) {
    println!("DEBUG: Creating room: {}", data.name);
    println!("DEBUG: State before insert: {} rooms", state.rooms.len());

    let room_id = Uuid::new_v4();
    let room = Room {
        id: room_id,
        name: data.name.clone(),
        members: HashSet::new(),
        events: Vec::new(),
    };

    state.rooms.insert(room_id, room);
    println!("DEBUG: State after insert: {} rooms", state.rooms.len());

    // Verify the room was inserted
    if let Some(inserted_room) = state.rooms.get(&room_id) {
        println!(
            "DEBUG: Successfully inserted room: {} - {}",
            inserted_room.id, inserted_room.name
        );
    } else {
        println!("ERROR: Room was NOT inserted!");
        return;
    }

    let rooms: Vec<RoomListItem> = state
        .rooms
        .iter()
        .map(|entry| {
            let room = entry.value();
            RoomListItem {
                id: room.id.to_string(),
                name: room.name.clone(),
                member_count: room.members.len(),
            }
        })
        .collect();

    let response = RoomListResponse { rooms };

    if let Err(e) = io.emit("room.list", &response).await {
        println!("FAILED to broadcast room list: {}", e);
    } else {
        println!(
            "Room '{}' created - broadcasted {} rooms to ALL clients",
            data.name,
            response.rooms.len()
        );
    }
}
