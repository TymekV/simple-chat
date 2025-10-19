use serde::{Deserialize, Serialize};
use socketioxide::{
    SocketIo,
    extract::{Data, SocketRef, State},
};
use ts_rs::TS;
use uuid::Uuid;

use crate::{
    models::{MessageDeleteEvent, MessageEditEvent, RoomEvent, RoomEventData},
    state::AppState,
};

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct EditMessagePayload {
    pub room: Uuid,
    pub message_id: Uuid,
    pub new_content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct DeleteMessagePayload {
    pub room: Uuid,
    pub message_id: Uuid,
}

pub async fn handle_edit_message(
    s: SocketRef,
    io: SocketIo,
    Data(data): Data<EditMessagePayload>,
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

    let mut message_found = false;
    let mut message_owner_check = false;

    if let Some(mut room) = state.rooms.get_mut(&data.room) {
        for event in &mut room.events {
            if event.id == data.message_id {
                message_found = true;

                if event.from != s.id {
                    println!(
                        "User {} trying to edit message {} they don't own",
                        s.id, data.message_id
                    );
                    return;
                }
                message_owner_check = true;

                if let RoomEventData::Message(ref mut message_event) = event.data {
                    message_event.content = data.new_content.clone();
                    message_event.edited = true;
                }
                break;
            }
        }
    }

    if !message_found {
        println!(
            "Message {} not found in room {}",
            data.message_id, data.room
        );
        return;
    }

    if !message_owner_check {
        return;
    }

    let edit_event = RoomEventData::MessageEdit(MessageEditEvent {
        message_id: data.message_id,
        new_content: data.new_content,
    });

    if let Err(e) = io
        .to(data.room.to_string())
        .emit(
            "room.event",
            &RoomEvent {
                id: Uuid::new_v4(),
                from: s.id,
                timestamp: chrono::Utc::now(),
                data: edit_event,
            },
        )
        .await
    {
        println!(
            "Failed to broadcast message edit to room {}: {}",
            data.room, e
        );
    }
}

pub async fn handle_delete_message(
    s: SocketRef,
    io: SocketIo,
    Data(data): Data<DeleteMessagePayload>,
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

    let mut message_found = false;
    let mut message_owner_check = false;

    if let Some(mut room) = state.rooms.get_mut(&data.room) {
        for event in &mut room.events {
            if event.id == data.message_id {
                message_found = true;

                if event.from != s.id {
                    println!(
                        "User {} trying to delete message {} they don't own",
                        s.id, data.message_id
                    );
                    return;
                }
                message_owner_check = true;

                if let RoomEventData::Message(ref mut message_event) = event.data {
                    message_event.deleted = true;
                    message_event.content = String::new();
                }
                break;
            }
        }
    }

    if !message_found {
        println!(
            "Message {} not found in room {}",
            data.message_id, data.room
        );
        return;
    }

    if !message_owner_check {
        return;
    }

    let delete_event = RoomEventData::MessageDelete(MessageDeleteEvent {
        message_id: data.message_id,
    });

    if let Err(e) = io
        .to(data.room.to_string())
        .emit(
            "room.event",
            &RoomEvent {
                id: Uuid::new_v4(),
                from: s.id,
                timestamp: chrono::Utc::now(),
                data: delete_event,
            },
        )
        .await
    {
        println!(
            "Failed to broadcast message delete to room {}: {}",
            data.room, e
        );
    }
}
