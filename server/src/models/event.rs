use chrono::{DateTime, Utc};
use serde::Serialize;
use ts_rs::TS;
use uuid::Uuid;

#[derive(Serialize, Debug, Clone, TS)]
pub struct Event {
    pub id: Uuid,
    pub from: Uuid,
    pub timestamp: DateTime<Utc>,
    pub data: EventData,
}

#[derive(Serialize, Debug, Clone, TS)]
pub enum EventData {
    Message(TextMessageEvent),
}

#[derive(Serialize, Debug, Clone, TS)]
pub struct TextMessageEvent {
    pub content: String,
}

#[derive(Serialize, Debug, Clone, TS)]
pub struct ReactionEvent {
    pub message_id: Uuid,
    pub reaction: String,
}
