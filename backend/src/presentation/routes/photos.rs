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

    let mut filename = String::new();
    let mut file_bytes: Option<Bytes> = None;

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
        }
    }

    let file_bytes = file_bytes.ok_or(DomainError::MissingFile)?;

    let photo = state
        .upload_photo
        .execute(filename, file_bytes.to_vec())
        .await?;
    Ok((axum::http::StatusCode::CREATED, Json(photo)))
}

pub async fn score_photo(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let result = state.score_photo.execute(&id).await?;
    Ok(Json(result))
}
