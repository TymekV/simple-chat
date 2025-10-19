use dashmap::DashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::models::Room;

#[derive(Clone)]
pub struct AppState {
    pub rooms: Arc<DashMap<Uuid, Room>>,
}
