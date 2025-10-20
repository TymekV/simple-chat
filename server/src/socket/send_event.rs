use chrono::Utc;
use serde::{Deserialize, Serialize};
use socketioxide::{
    SocketIo,
    extract::{Data, SocketRef, State},
};
use ts_rs::TS;
use uuid::Uuid;

use crate::{
    models::{MessageReply, ReplyMessageType, RoomEvent, RoomEventData},
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

            if let Some(reply) = &mut message_event.reply_to {
                if let Some(reply_info) =
                    validate_and_enrich_reply(&reply.message_id, &data.room, &state)
                {
                    *reply = reply_info;
                } else {
                    message_event.reply_to = None;
                }
            }
        }
        RoomEventData::Image(image_event) => {
            if let Some(reply) = &mut image_event.reply_to {
                if let Some(reply_info) =
                    validate_and_enrich_reply(&reply.message_id, &data.room, &state)
                {
                    *reply = reply_info;
                } else {
                    image_event.reply_to = None;
                }
            }
        }
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

fn validate_and_enrich_reply(
    message_id: &Uuid,
    room_id: &Uuid,
    state: &AppState,
) -> Option<MessageReply> {
    let room = state.rooms.get(room_id)?;

    let original_event = room.events.iter().find(|event| event.id == *message_id)?;

    let username = state.usernames.get(&original_event.from).map(|u| u.clone());

    let (content_preview, message_type) = match &original_event.data {
        RoomEventData::Message(msg) => {
            if msg.deleted {
                (
                    "This message was deleted".to_string(),
                    ReplyMessageType::Deleted,
                )
            } else {
                let preview = if msg.content.len() > 100 {
                    format!("{}...", &msg.content[..100])
                } else {
                    msg.content.clone()
                };
                (preview, ReplyMessageType::Text)
            }
        }
        RoomEventData::Image(img) => (format!("📷 {}", img.filename), ReplyMessageType::Image),
        _ => return None,
    };

    Some(MessageReply {
        message_id: *message_id,
        user_id: original_event.from,
        username,
        content_preview,
        message_type,
    })
}
