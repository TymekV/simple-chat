use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use socketioxide::socket::Sid;
use ts_rs::TS;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct RoomEvent {
    pub id: Uuid,
    #[ts(type = "String")]
    pub from: Sid,
    pub timestamp: DateTime<Utc>,
    pub data: RoomEventData,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub enum RoomEventData {
    Message(TextMessageEvent),
    Reaction(ReactionEvent),
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct TextMessageEvent {
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct ReactionEvent {
    pub message_id: Uuid,
    pub reaction: String,
}
