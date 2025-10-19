use dashmap::DashMap;
use uuid::Uuid;

use crate::models::Room;

#[derive(Clone)]
pub struct AppState {
    pub rooms: DashMap<Uuid, Room>,
}
