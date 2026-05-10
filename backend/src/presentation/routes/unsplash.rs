use axum::{
    extract::State,
    response::{IntoResponse, Json},
};
use std::sync::Arc;
use tracing::info;

use crate::presentation::error::ApiError;
use crate::AppState;

pub async fn random_unsplash_photo(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, ApiError> {
    info!("random_unsplash_photo handler called");
    let result = state.random_unsplash.execute().await?;
    info!("random_unsplash_photo handler succeeded: {}", result.title);
    Ok(Json(result))
}
