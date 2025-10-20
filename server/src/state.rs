use dashmap::DashMap;
use socketioxide::socket::Sid;
use std::{collections::HashSet, sync::Arc};
use uuid::Uuid;

use crate::models::Room;

#[derive(Clone)]
pub struct AppState {
    pub rooms: Arc<DashMap<Uuid, Room>>,
    pub usernames: Arc<DashMap<Sid, String>>,
    pub starred_messages: Arc<DashMap<(Uuid, Sid), HashSet<Uuid>>>,
}
