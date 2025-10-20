use socketioxide::extract::{Data, SocketRef, State};
use std::collections::HashSet;
use tracing::{error, info};
use uuid::Uuid;

use crate::{
    models::{MessageStarEvent, MessageUnstarEvent, RoomEvent, RoomEventData},
    state::AppState,
};

#[derive(serde::Deserialize, Debug, ts_rs::TS)]
#[ts(export)]
pub struct StarMessageRequest {
    pub room_id: Uuid,
    pub message_id: Uuid,
}

#[derive(serde::Deserialize, Debug, ts_rs::TS)]
#[ts(export)]
pub struct UnstarMessageRequest {
    pub room_id: Uuid,
    pub message_id: Uuid,
}

#[derive(serde::Serialize, Debug, ts_rs::TS)]
#[ts(export)]
pub struct StarredMessagesResponse {
    pub starred_message_ids: Vec<Uuid>,
}

#[derive(serde::Serialize, Debug)]
pub struct ErrorResponse {
    pub message: String,
}

pub async fn star_message(
    socket: SocketRef,
    Data(data): Data<StarMessageRequest>,
    State(state): State<AppState>,
) {
    let user_id = socket.id;

    if !state.rooms.contains_key(&data.room_id) {
        error!(
            "User {} tried to star message in non-existent room {}",
            user_id, data.room_id
        );
        let _ = socket.emit(
            "error",
            &ErrorResponse {
                message: "Room does not exist".to_string(),
            },
        );
        return;
    }

    let is_member = state
        .rooms
        .get(&data.room_id)
        .map(|room| room.members.contains(&user_id))
        .unwrap_or(false);

    if !is_member {
        error!(
            "User {} tried to star message in room {} they're not a member of",
            user_id, data.room_id
        );
        let _ = socket.emit(
            "error",
            &ErrorResponse {
                message: "You are not a member of this room".to_string(),
            },
        );
        return;
    }

    let message_exists = state
        .rooms
        .get(&data.room_id)
        .map(|room| room.events.iter().any(|event| event.id == data.message_id))
        .unwrap_or(false);

    if !message_exists {
        error!(
            "User {} tried to star non-existent message {} in room {}",
            user_id, data.message_id, data.room_id
        );
        let _ = socket.emit(
            "error",
            &ErrorResponse {
                message: "Message does not exist".to_string(),
            },
        );
        return;
    }

    let key = (data.room_id, user_id);
    state
        .starred_messages
        .entry(key)
        .or_insert_with(HashSet::new)
        .insert(data.message_id);

    let star_event = RoomEvent {
        id: Uuid::new_v4(),
        from: user_id,
        timestamp: chrono::Utc::now(),
        data: RoomEventData::MessageStar(MessageStarEvent {
            message_id: data.message_id,
        }),
    };

    if let Some(mut room) = state.rooms.get_mut(&data.room_id) {
        room.events.push(star_event.clone());
    }

    if let Err(e) = socket.emit("room.event", &star_event) {
        error!("Failed to emit star event: {}", e);
    }

    info!(
        "User {} starred message {} in room {}",
        user_id, data.message_id, data.room_id
    );
}

pub async fn unstar_message(
    socket: SocketRef,
    Data(data): Data<UnstarMessageRequest>,
    State(state): State<AppState>,
) {
    let user_id = socket.id;

    if !state.rooms.contains_key(&data.room_id) {
        error!(
            "User {} tried to unstar message in non-existent room {}",
            user_id, data.room_id
        );
        let _ = socket.emit(
            "error",
            &ErrorResponse {
                message: "Room does not exist".to_string(),
            },
        );
        return;
    }

    let is_member = state
        .rooms
        .get(&data.room_id)
        .map(|room| room.members.contains(&user_id))
        .unwrap_or(false);

    if !is_member {
        error!(
            "User {} tried to unstar message in room {} they're not a member of",
            user_id, data.room_id
        );
        let _ = socket.emit(
            "error",
            &ErrorResponse {
                message: "You are not a member of this room".to_string(),
            },
        );
        return;
    }

    let key = (data.room_id, user_id);
    let was_starred = if let Some(mut starred_set) = state.starred_messages.get_mut(&key) {
        starred_set.remove(&data.message_id)
    } else {
        false
    };

    if !was_starred {
        error!(
            "User {} tried to unstar message {} that wasn't starred in room {}",
            user_id, data.message_id, data.room_id
        );
        let _ = socket.emit(
            "error",
            &ErrorResponse {
                message: "Message was not starred".to_string(),
            },
        );
        return;
    }

    let unstar_event = RoomEvent {
        id: Uuid::new_v4(),
        from: user_id,
        timestamp: chrono::Utc::now(),
        data: RoomEventData::MessageUnstar(MessageUnstarEvent {
            message_id: data.message_id,
        }),
    };

    if let Some(mut room) = state.rooms.get_mut(&data.room_id) {
        room.events.push(unstar_event.clone());
    }

    if let Err(e) = socket.emit("room.event", &unstar_event) {
        error!("Failed to emit unstar event: {}", e);
    }

    info!(
        "User {} unstarred message {} in room {}",
        user_id, data.message_id, data.room_id
    );
}

pub async fn get_starred_messages(
    socket: SocketRef,
    Data(room_id): Data<Uuid>,
    State(state): State<AppState>,
) {
    let user_id = socket.id;

    if !state.rooms.contains_key(&room_id) {
        error!(
            "User {} tried to get starred messages in non-existent room {}",
            user_id, room_id
        );
        let _ = socket.emit(
            "error",
            &ErrorResponse {
                message: "Room does not exist".to_string(),
            },
        );
        return;
    }

    let is_member = state
        .rooms
        .get(&room_id)
        .map(|room| room.members.contains(&user_id))
        .unwrap_or(false);

    if !is_member {
        error!(
            "User {} tried to get starred messages in room {} they're not a member of",
            user_id, room_id
        );
        let _ = socket.emit(
            "error",
            &ErrorResponse {
                message: "You are not a member of this room".to_string(),
            },
        );
        return;
    }

    let key = (room_id, user_id);
    let starred_message_ids: Vec<Uuid> = state
        .starred_messages
        .get(&key)
        .map(|starred_set| starred_set.iter().copied().collect())
        .unwrap_or_default();

    let response = StarredMessagesResponse {
        starred_message_ids,
    };

    if let Err(e) = socket.emit("starred_messages.list", &response) {
        error!("Failed to emit starred messages list: {}", e);
    }

    info!(
        "User {} requested starred messages in room {}, found {} messages",
        user_id,
        room_id,
        response.starred_message_ids.len()
    );
}
