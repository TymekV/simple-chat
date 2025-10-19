use color_eyre::eyre::Result;
use socketioxide::{SocketIo, extract::SocketRef};

pub fn init_io(io: SocketIo) -> Result<()> {
    io.ns("/", |s: SocketRef| {});

    Ok(())
}
