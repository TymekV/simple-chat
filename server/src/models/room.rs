use serde::Serialize;
use ts_rs::TS;
use uuid::Uuid;

use crate::models::Event;

#[derive(Serialize, Debug, Clone, TS)]
pub struct Room {
    pub id: Uuid,
    pub name: String,
    pub events: Vec<Event>,
}
