use axum::{
    extract::State,
    response::{IntoResponse, Json},
};
use std::sync::Arc;
use tracing::info;

use crate::application::dto::BattleRequestDto;
use crate::presentation::error::ApiError;
use crate::AppState;

pub async fn battle_photo(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(id): axum::extract::Path<String>,
    payload: Option<axum::extract::Json<BattleRequestDto>>,
) -> Result<impl IntoResponse, ApiError> {
    info!("battle_photo handler called with id: {}", id);
    let opponent = payload.map(|j| j.0);
    let result = state.battle_photo.execute(&id, opponent).await?;
    info!("battle_photo handler succeeded for id: {}", id);
    Ok(Json(result))
}
