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
    let Some(room) = state.rooms.get(&data.room) else {
        return;
    };

    if !room.members.contains(&s.id) {
        return;
    }

    let id = Uuid::new_v4();

    let event = RoomEvent {
        id,
        from: s.id,
        timestamp: Utc::now(),
        data: data.payload.clone(),
    };

    io.to(data.room.to_string())
        .emit("room.event", &event)
        .await
        .ok();
}
