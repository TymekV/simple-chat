mod models;
mod socket;
mod state;

use axum::{Router, routing::get};
use color_eyre::eyre::Context;
use socketioxide::{SocketIoBuilder, layer::SocketIoLayer};
use tokio::net::TcpListener;
use tracing::{info, level_filters::LevelFilter, warn};
use tracing_error::ErrorLayer;
use tracing_subscriber::{
    fmt::format::FmtSpan, layer::SubscriberExt as _, util::SubscriberInitExt as _,
};

use crate::{socket::init_io, state::AppState};

#[tokio::main]
async fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;

    dotenvy::dotenv().ok();

    init_tracing().wrap_err("failed to set global tracing subscriber")?;

    let app_state = AppState {
        rooms: std::sync::Arc::new(Default::default()),
        usernames: std::sync::Arc::new(Default::default()),
    };

    let (layer, io) = SocketIoBuilder::new()
        .with_state(app_state.clone())
        .build_layer();
    let app = init_axum(app_state.clone(), layer);

    init_io(io)?;

    let listener = init_listener()
        .await
        .wrap_err("failed to bind to address")?;

    info!(
        "listening on {}",
        listener
            .local_addr()
            .wrap_err("failed to get local address")?
    );

    axum::serve(listener, app.into_make_service())
        .await
        .wrap_err("failed to run server")?;

    Ok(())
}

fn init_tracing() -> color_eyre::Result<()> {
    tracing_subscriber::Registry::default()
        .with(tracing_subscriber::fmt::layer().with_span_events(FmtSpan::NEW | FmtSpan::CLOSE))
        .with(ErrorLayer::default())
        .with(
            tracing_subscriber::EnvFilter::builder()
                .with_default_directive(LevelFilter::INFO.into())
                .from_env()?,
        )
        .try_init()?;

    Ok(())
}

fn init_axum(state: AppState, io_layer: SocketIoLayer) -> Router {
    axum::Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .layer(io_layer)
        .with_state(state)
}

async fn init_listener() -> Result<TcpListener, std::io::Error> {
    let addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| {
        warn!("missing BIND_ADDR, defaulting to http://localhost:3002");
        "localhost:3002".to_string()
    });

    TcpListener::bind(addr).await
}
