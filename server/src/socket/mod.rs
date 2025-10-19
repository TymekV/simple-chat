mod room_events;
mod room_list;
mod send_event;

use color_eyre::eyre::Result;
use socketioxide::{SocketIo, extract::SocketRef};

pub fn init_io(io: SocketIo) -> Result<()> {
    io.ns("/", |s: SocketRef| {
        println!("=== GLOBAL CLIENT CONNECTED ===");
        println!("Client ID: {} - will receive ALL rooms globally", s.id);

        s.on("room.send", send_event::handle);
        s.on("room.join", room_events::join_room);
        s.on("room.leave", room_events::leave_room);
        s.on("room.list", room_list::list_rooms);
        s.on("room.create", room_list::create_room);

        s.on_disconnect(|s: SocketRef| {
            println!("=== CLIENT DISCONNECTED ===");
            println!("Client ID: {}", s.id);
        });
    });

    Ok(())
}
