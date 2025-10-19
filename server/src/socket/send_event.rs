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

    let mut event_data = data.payload.clone();

    match &mut event_data {
        RoomEventData::Message(message_event) => {
            message_event.edited = false;
            message_event.deleted = false;
        }
        RoomEventData::Image(_) => {}
        _ => {}
    }

    let event = RoomEvent {
        id,
        from: s.id,
        timestamp: Utc::now(),
        data: event_data,
    };

    if let Some(mut room) = state.rooms.get_mut(&data.room) {
        room.events.push(event.clone());
    }

    if let Err(e) = io
        .to(data.room.to_string())
        .emit("room.event", &event)
        .await
    {
        println!("Failed to broadcast message to room {}: {}", data.room, e);
    }
}
