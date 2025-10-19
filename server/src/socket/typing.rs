use serde::{Deserialize, Serialize};
use socketioxide::{
    SocketIo,
    extract::{Data, SocketRef, State},
};

use ts_rs::TS;
use uuid::Uuid;

use crate::state::AppState;

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct StartTypingPayload {
    pub room_id: Uuid,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct StopTypingPayload {
    pub room_id: Uuid,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct TypingIndicator {
    pub user_id: String,
    pub username: Option<String>,
    pub room_id: String,
}

pub async fn start_typing(
    s: SocketRef,
    io: SocketIo,
    Data(data): Data<StartTypingPayload>,
    State(state): State<AppState>,
) {
    if !is_user_in_room(&state, &s.id, &data.room_id) {
        return;
    }

    let username = state.usernames.get(&s.id).map(|u| u.clone());

    let typing_indicator = TypingIndicator {
        user_id: s.id.to_string(),
        username,
        room_id: data.room_id.to_string(),
    };

    if let Err(e) = io
        .to(data.room_id.to_string())
        .except(s.id.to_string())
        .emit("typing.start", &typing_indicator)
        .await
    {
        println!("Failed to broadcast typing start: {}", e);
    }
}

pub async fn stop_typing(
    s: SocketRef,
    io: SocketIo,
    Data(data): Data<StopTypingPayload>,
    State(state): State<AppState>,
) {
    if !is_user_in_room(&state, &s.id, &data.room_id) {
        return;
    }

    let username = state.usernames.get(&s.id).map(|u| u.clone());

    let typing_indicator = TypingIndicator {
        user_id: s.id.to_string(),
        username,
        room_id: data.room_id.to_string(),
    };

    if let Err(e) = io
        .to(data.room_id.to_string())
        .except(s.id.to_string())
        .emit("typing.stop", &typing_indicator)
        .await
    {
        println!("Failed to broadcast typing stop: {}", e);
    }
}

fn is_user_in_room(state: &AppState, user_id: &socketioxide::socket::Sid, room_id: &Uuid) -> bool {
    if let Some(room) = state.rooms.get(room_id) {
        room.members.contains(user_id)
    } else {
        false
    }
}
