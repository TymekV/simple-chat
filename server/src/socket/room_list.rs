use dashmap::DashMap;
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

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct RoomCreatedEvent {
    pub room: RoomListItem,
}

pub fn get_rooms(rooms: &DashMap<Uuid, Room>) -> Vec<RoomListItem> {
    rooms
        .iter()
        .map(|entry| {
            let room = entry.value();
            RoomListItem {
                id: room.id.to_string(),
                name: room.name.clone(),
                member_count: room.members.len(),
            }
        })
        .collect()
}

pub async fn list_rooms(s: SocketRef, _io: SocketIo, State(state): State<AppState>) {
    println!("User {} requested room list", s.id);

    let rooms = get_rooms(&state.rooms);

    let response = RoomListResponse { rooms };

    if let Err(e) = s.emit("room.list", &response) {
        println!("Failed to send room list to user {}: {}", s.id, e);
    } else {
        println!(
            "Sent room list with {} rooms to user {}",
            response.rooms.len(),
            s.id
        );
    }
}

pub async fn create_room(
    s: SocketRef,
    io: SocketIo,
    Data(data): Data<CreateRoomPayload>,
    State(state): State<AppState>,
) {
    println!("User {} requested to create room: {}", s.id, data.name);

    let room_id = Uuid::new_v4();
    let room = Room {
        id: room_id,
        name: data.name.clone(),
        members: HashSet::new(),
        events: Vec::new(),
    };

    state.rooms.insert(room_id, room);

    let room_item = RoomListItem {
        id: room_id.to_string(),
        name: data.name,
        member_count: 0,
    };

    let event = RoomCreatedEvent {
        room: room_item.clone(),
    };

    // Notify the creator
    if let Err(e) = s.emit("room.created", &event) {
        println!("Failed to notify room creator: {}", e);
    }

    let rooms = get_rooms(&state.rooms);

    let response = RoomListResponse { rooms };

    if let Err(e) = s.emit("room.list", &response) {
        println!("Failed to send room list to user {}: {}", s.id, e);
    } else {
        println!(
            "Sent room list with {} rooms to user {}",
            response.rooms.len(),
            s.id
        );
    }
}
