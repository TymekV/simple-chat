mod room_events;
mod send_event;

use color_eyre::eyre::Result;
use socketioxide::{SocketIo, extract::SocketRef};

pub fn init_io(io: SocketIo) -> Result<()> {
    io.ns("/", |s: SocketRef| {
        s.on("room.send", send_event::handle);
        s.on("room.join", room_events::join_room);
        s.on("room.leave", room_events::leave_room);
    });

    Ok(())
}
