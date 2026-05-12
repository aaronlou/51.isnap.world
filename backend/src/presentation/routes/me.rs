use axum::{
    extract::State,
    http::HeaderMap,
    response::{IntoResponse, Json},
};
use serde::Deserialize;
use std::sync::Arc;

use crate::application::dto::QuotaDto;
use crate::presentation::error::ApiError;
use crate::AppState;

const DAILY_MENTOR_LIMIT: i32 = 3;
const DAILY_UPLOAD_LIMIT: i32 = 3;

#[derive(Debug, serde::Serialize)]
pub struct MeResponse {
    pub id: String,
    pub nickname: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNicknameRequest {
    pub nickname: String,
}

pub async fn get_me(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<MeResponse>, ApiError> {
    let user_id = headers
        .get("X-User-ID")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let Some(uid) = user_id else {
        return Err(ApiError::External("X-User-ID required".to_string()));
    };

    match state.repository.get_user(&uid).await? {
        Some(user) => Ok(Json(MeResponse {
            id: user.id,
            nickname: user.nickname.unwrap_or_else(|| "匿名用户".to_string()),
        })),
        None => Err(ApiError::External("User not found".to_string())),
    }
}

pub async fn get_quota(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<QuotaDto>, ApiError> {
    let user_id = headers
        .get("X-User-ID")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let Some(uid) = user_id else {
        return Ok(Json(QuotaDto {
            uploads_today: 0,
            upload_limit: DAILY_UPLOAD_LIMIT,
            mentor_messages_today: 0,
            mentor_message_limit: DAILY_MENTOR_LIMIT,
            is_donor: false,
        }));
    };

    let uploads_today = state.repository.count_uploads_today(&uid).await.unwrap_or(0);
    let (_, mentor_usage) = state.repository.get_mentor_chat_usage(&uid).await.unwrap_or((String::new(), 0));
    let is_donor = state.repository.has_donated(&uid).await.unwrap_or(false);

    Ok(Json(QuotaDto {
        uploads_today,
        upload_limit: DAILY_UPLOAD_LIMIT,
        mentor_messages_today: mentor_usage,
        mentor_message_limit: DAILY_MENTOR_LIMIT,
        is_donor,
    }))
}

pub async fn update_nickname(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    axum::extract::Json(payload): axum::extract::Json<UpdateNicknameRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let user_id = headers
        .get("X-User-ID")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let Some(uid) = user_id else {
        return Ok((axum::http::StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "X-User-ID required"}))));
    };

    let trimmed = payload.nickname.trim();
    if trimmed.is_empty() || trimmed.len() > 32 {
        return Ok((axum::http::StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "Nickname must be 1-32 characters"}))));
    }

    state.repository.update_nickname(&uid, trimmed).await?;

    Ok((axum::http::StatusCode::OK, Json(serde_json::json!({"nickname": trimmed}))))
}
