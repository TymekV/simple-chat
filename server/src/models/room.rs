use std::collections::HashSet;

use serde::{Deserialize, Serialize};
use socketioxide::socket::Sid;
use ts_rs::TS;
use uuid::Uuid;

use crate::models::RoomEvent;

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
pub struct Room {
    pub id: Uuid,
    pub name: String,
    #[ts(type = "HashSet<String>")]
    pub members: HashSet<Sid>,
    pub events: Vec<RoomEvent>,
}
