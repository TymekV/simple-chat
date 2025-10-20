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
    Image(ImageMessageEvent),
    MessageEdit(MessageEditEvent),
    MessageDelete(MessageDeleteEvent),
    Reaction(ReactionEvent),
    ReactionRemove(ReactionRemoveEvent),
    UserJoin(UserJoinEvent),
    UserLeave(UserLeaveEvent),
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct TextMessageEvent {
    pub content: String,
    #[serde(default)]
    pub edited: bool,
    #[serde(default)]
    pub deleted: bool,
    #[serde(default)]
    pub reply_to: Option<MessageReply>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct ImageMessageEvent {
    pub image_data: String, // Base64 encoded image
    pub filename: String,
    pub mime_type: String,
    pub size: u32,
    #[serde(default)]
    pub width: Option<u32>,
    #[serde(default)]
    pub height: Option<u32>,
    #[serde(default)]
    pub reply_to: Option<MessageReply>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct MessageEditEvent {
    pub message_id: Uuid,
    pub new_content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct MessageDeleteEvent {
    pub message_id: Uuid,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct ReactionEvent {
    pub message_id: Uuid,
    pub reaction: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct ReactionRemoveEvent {
    pub message_id: Uuid,
    pub reaction: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct UserJoinEvent {
    #[ts(type = "String")]
    pub user_id: Sid,
    pub username: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct UserLeaveEvent {
    #[ts(type = "String")]
    pub user_id: Sid,
    pub username: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct RoomMembersResponse {
    pub members: Vec<RoomMember>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct RoomMember {
    #[ts(type = "String")]
    pub user_id: Sid,
    pub username: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct MessageReply {
    pub message_id: Uuid,
    #[ts(type = "String")]
    pub user_id: Sid,
    pub username: Option<String>,
    pub content_preview: String,
    pub message_type: ReplyMessageType,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub enum ReplyMessageType {
    Text,
    Image,
    Deleted,
}
