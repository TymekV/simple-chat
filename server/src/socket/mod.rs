mod message_management;
mod room_events;
mod room_list;
mod send_event;
mod typing;
mod user_management;

use color_eyre::eyre::Result;
use socketioxide::{
    SocketIo,
    extract::{SocketRef, State},
};

use crate::state::AppState;

pub fn init_io(io: SocketIo) -> Result<()> {
    let io_clone = io.clone();
    io.ns("/", move |s: SocketRef| {
        println!("=== GLOBAL CLIENT CONNECTED ===");
        println!("Client ID: {} - will receive ALL rooms globally", s.id);

        s.on("room.send", send_event::handle);
        s.on("room.join", room_events::join_room);
        s.on("room.leave", room_events::leave_room);
        s.on("room.list", room_list::list_rooms);
        s.on("room.create", room_list::create_room);
        s.on("user.set_username", user_management::set_username);
        s.on("room.get_members", user_management::get_room_members);
        s.on("typing.start", typing::start_typing);
        s.on("typing.stop", typing::stop_typing);
        s.on("message.edit", message_management::handle_edit_message);
        s.on("message.delete", message_management::handle_delete_message);

        let io_for_disconnect = io_clone.clone();
        s.on_disconnect(move |s: SocketRef, State(state): State<AppState>| {
            let io = io_for_disconnect.clone();
            async move {
                println!("=== CLIENT DISCONNECTED ===");
                println!("Client ID: {}", s.id);

                user_management::handle_disconnect(s, io, state).await;
            }
        });
    });

    Ok(())
}
