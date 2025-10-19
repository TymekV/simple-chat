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

    if let Err(e) = s.emit("room.list", &response) {
        println!("Failed to send room list to user {}: {}", s.id, e);
    }
}

pub async fn create_room(
    io: SocketIo,
    Data(data): Data<CreateRoomPayload>,
    State(state): State<AppState>,
) {
    let room_id = Uuid::new_v4();
    let room = Room {
        id: room_id,
        name: data.name.clone(),
        members: HashSet::new(),
        events: Vec::new(),
    };

    state.rooms.insert(room_id, room);

    let Some(_) = state.rooms.get(&room_id) else {
        println!("ERROR: Room was NOT inserted!");
        return;
    };

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

    io.emit("room.list", &response).await.ok();
}
