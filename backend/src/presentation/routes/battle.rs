use axum::{
    extract::State,
    response::{IntoResponse, Json},
};
use std::sync::Arc;
use tracing::info;

use crate::presentation::error::ApiError;
use crate::AppState;

pub async fn battle_photo(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    info!("battle_photo handler called with id: {}", id);
    let result = state.battle_photo.execute(&id).await?;
    info!("battle_photo handler succeeded for id: {}", id);
    Ok(Json(result))
}
