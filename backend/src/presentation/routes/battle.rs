use axum::{
    extract::State,
    http::HeaderMap,
    response::{IntoResponse, Json},
};
use std::sync::Arc;
use tracing::info;

use crate::application::dto::BattleRequestDto;
use crate::presentation::error::ApiError;
use crate::AppState;

pub async fn battle_photo(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    axum::extract::Path(id): axum::extract::Path<String>,
    payload: Option<axum::extract::Json<BattleRequestDto>>,
) -> Result<impl IntoResponse, ApiError> {
    info!("battle_photo handler called with id: {}", id);

    // 提取匿名用户 ID（Battle 即激活）
    let user_id = headers
        .get("X-User-ID")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    if let Some(ref uid) = user_id {
        state.repository.ensure_user(uid).await?;
    }

    let opponent = payload.map(|j| j.0);
    let result = state.battle_photo.execute(&id, opponent).await?;
    info!("battle_photo handler succeeded for id: {}", id);
    Ok(Json(result))
}
