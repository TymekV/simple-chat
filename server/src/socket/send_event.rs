use chrono::Utc;
use serde::{Deserialize, Serialize};
use socketioxide::{
    SocketIo,
    extract::{Data, SocketRef, State},
};
use ts_rs::TS;
use uuid::Uuid;

use crate::{
    models::{RoomEvent, RoomEventData},
    state::AppState,
};

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct SendEventPayload {
    pub room: Uuid,
    pub payload: RoomEventData,
}

pub async fn handle(
    s: SocketRef,
    io: SocketIo,
    Data(data): Data<SendEventPayload>,
    State(state): State<AppState>,
) {
    // Check if room exists and user is a member
    {
        let Some(room) = state.rooms.get(&data.room) else {
            println!("Room {} not found for user {}", data.room, s.id);
            return;
        };

        if !room.members.contains(&s.id) {
            println!("User {} not a member of room {}", s.id, data.room);
            return;
        };
    }

    let id = Uuid::new_v4();

    let event = RoomEvent {
        id,
        from: s.id,
        timestamp: Utc::now(),
        data: data.payload.clone(),
    };

    // Store the event in room history
    if let Some(mut room) = state.rooms.get_mut(&data.room) {
        room.events.push(event.clone());
    }

    // Broadcast to all room members
    if let Err(e) = io
        .to(data.room.to_string())
        .emit("room.event", &event)
        .await
    {
        println!("Failed to broadcast message to room {}: {}", data.room, e);
    }
}
