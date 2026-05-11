use axum::{
    extract::{Multipart, State},
    http::HeaderMap,
    response::{IntoResponse, Json},
};
use bytes::Bytes;
use std::sync::Arc;
use tracing::{error, info};

use crate::domain::errors::DomainError;
use crate::presentation::error::ApiError;
use crate::AppState;

pub async fn list_photos(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, ApiError> {
    let photos = state.list_photos.execute().await?;
    Ok(Json(photos))
}

pub async fn upload_photo(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, ApiError> {
    info!("Upload request received");
    if let Some(ct) = headers.get("content-type") {
        info!("Content-Type: {:?}", ct);
    }

    // 提取匿名用户 ID（上传即激活）
    let user_id = headers
        .get("X-User-ID")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    if let Some(ref uid) = user_id {
        state.repository.ensure_user(uid).await?;
    }

    let mut filename = String::new();
    let mut file_bytes: Option<Bytes> = None;
    let mut is_battle = false;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| {
            error!("Multipart next_field error: {:?}", e);
            let detail = std::error::Error::source(&e)
                .map(|s| format!("{}: {}", e, s))
                .unwrap_or_else(|| e.to_string());
            DomainError::MultipartError(detail)
        })?
    {
        let name = field.name().unwrap_or("").to_string();
        info!("Processing field: {}", name);
        if name == "file" {
            filename = field.file_name().unwrap_or("unknown.jpg").to_string();
            let data = field
                .bytes()
                .await
                .map_err(|e| {
                    error!("Multipart bytes error: {:?}", e);
                    let detail = std::error::Error::source(&e)
                        .map(|s| format!("{}: {}", e, s))
                        .unwrap_or_else(|| e.to_string());
                    DomainError::MultipartError(detail)
                })?;
            info!("File size: {} bytes", data.len());
            file_bytes = Some(data);
        } else if name == "is_battle" {
            let val = field.text().await.unwrap_or_default();
            is_battle = val == "1" || val == "true";
        }
    }

    let file_bytes = file_bytes.ok_or(DomainError::MissingFile)?;

    let photo = state
        .upload_photo
        .execute(filename, file_bytes.to_vec(), is_battle, user_id)
        .await?;
    Ok((axum::http::StatusCode::CREATED, Json(photo)))
}

pub async fn score_photo(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    tracing::info!("score_photo handler called with id: {}", id);

    let user_id = headers
        .get("X-User-ID")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let mut result = state.score_photo.execute(&id).await?;
    tracing::info!("score_photo handler succeeded for id: {}", id);

    // 若用户已登录，计算并附加个人纵向统计
    if let Some(ref uid) = user_id {
        let history = state.repository.list_scored_by_user(uid).await?;
        let history_excluding_current: Vec<_> = history
            .into_iter()
            .filter(|p| p.id.as_str() != id)
            .collect();

        let total_scored = history_excluding_current.len() as i32;
        let is_first_score = total_scored == 0;

        if !is_first_score {
            let scores: Vec<f32> = history_excluding_current.iter()
                .filter_map(|p| p.score_value())
                .collect();
            if !scores.is_empty() {
                let avg_score = scores.iter().sum::<f32>() / scores.len() as f32;
                let best_score = scores.iter().fold(0.0f32, |a, &b| a.max(b));
                let is_new_best = result.score > best_score;
                let score_change = result.score - avg_score;

                result.personal_stats = Some(crate::application::dto::PersonalStatsDto {
                    total_scored,
                    avg_score: (avg_score * 10.0).round() / 10.0,
                    best_score: (best_score * 10.0).round() / 10.0,
                    is_first_score,
                    is_new_best,
                    score_change: Some((score_change * 10.0).round() / 10.0),
                });
            }
        } else {
            result.personal_stats = Some(crate::application::dto::PersonalStatsDto {
                total_scored: 0,
                avg_score: 0.0,
                best_score: 0.0,
                is_first_score: true,
                is_new_best: false,
                score_change: None,
            });
        }
    }

    Ok(Json(result))
}

pub async fn delete_photo(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    tracing::info!("delete_photo handler called with id: {}", id);
    let result = state.delete_photo.execute(&id).await?;
    tracing::info!("delete_photo handler succeeded for id: {}", id);
    Ok(Json(result))
}
