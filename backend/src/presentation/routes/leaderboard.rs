use axum::{extract::State, response::IntoResponse, Json};
use std::sync::Arc;

use crate::presentation::error::ApiError;
use crate::AppState;

pub async fn get_leaderboard(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, ApiError> {
    let photos = state.get_leaderboard.execute().await?;
    Ok(Json(photos))
}
