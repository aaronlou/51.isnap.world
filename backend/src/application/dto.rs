use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::domain::photo::Photo;

/// 照片响应 DTO
/// 统一前后端数据交换格式，避免直接使用领域实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhotoDto {
    pub id: String,
    pub filename: String,
    pub score: Option<f32>,
    pub review: Option<String>,
    pub uploaded_at: DateTime<Utc>,
    pub url: String,
    pub thumbnail_url: String,
    pub engine: Option<String>,
}

impl PhotoDto {
    pub fn from_photo(photo: &Photo, base_url: &str) -> Self {
        Self {
            id: photo.id.as_str().to_string(),
            filename: photo.filename.clone(),
            score: photo.score_value(),
            review: photo.review.clone(),
            uploaded_at: photo.uploaded_at,
            url: photo.url(base_url),
            thumbnail_url: photo.thumbnail_url(base_url),
            engine: photo.engine.clone(),
        }
    }
}

/// 评分结果 DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreResultDto {
    pub id: String,
    pub score: f32,
    pub review: String,
    pub engine: Option<String>,
}
