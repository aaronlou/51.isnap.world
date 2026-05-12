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
    pub user_id: Option<String>,
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
            user_id: photo.user_id.clone(),
        }
    }
}

/// 个人纵向统计 DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalStatsDto {
    /// 历史已评分作品数（不含本次）
    pub total_scored: i32,
    /// 历史平均分
    pub avg_score: f32,
    /// 历史最高分
    pub best_score: f32,
    /// 是否首次评分
    pub is_first_score: bool,
    /// 本次是否打破个人最高分记录
    pub is_new_best: bool,
    /// 相对于历史平均分的变化（本次 - 平均）
    pub score_change: Option<f32>,
}

/// 评分结果 DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreResultDto {
    pub id: String,
    pub score: f32,
    pub review: String,
    pub engine: Option<String>,
    /// 是否达到画廊收录标准
    pub accepted: bool,
    /// 个人纵向统计（仅当请求带 X-User-ID 时返回）
    pub personal_stats: Option<PersonalStatsDto>,
}

/// 对决请求 DTO（可选传递对手信息）
#[derive(Debug, Clone, Deserialize)]
pub struct BattleRequestDto {
    pub opponent_url: Option<String>,
    pub opponent_title: Option<String>,
    pub opponent_photographer: Option<String>,
    pub opponent_photographer_link: Option<String>,
}

/// 对决结果 DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BattleResultDto {
    pub user_photo_id: String,
    pub user_photo: PhotoDto,
    pub user_score: f32,
    pub user_review: String,
    pub opponent_photo_url: String,
    pub opponent_photo_title: String,
    pub opponent_photographer: String,
    pub opponent_photo_html_link: String,
    pub opponent_score: f32,
    pub opponent_review: String,
    pub winner: String,
    pub comparison: String,
    pub engine: String,
}

/// 导师对话消息 DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MentorChatMessageDto {
    pub role: String,
    pub content: String,
    pub created_at: String,
}

/// 导师对话请求 DTO
#[derive(Debug, Clone, Deserialize)]
pub struct MentorChatRequestDto {
    pub message: String,
}

/// 导师对话响应 DTO
#[derive(Debug, Clone, Serialize)]
pub struct MentorChatResponseDto {
    pub reply: String,
    pub remaining: i32,
    pub messages: Vec<MentorChatMessageDto>,
}

/// 用户配额 DTO
#[derive(Debug, Clone, Serialize)]
pub struct QuotaDto {
    pub uploads_today: i32,
    pub upload_limit: i32,
    pub mentor_messages_today: i32,
    pub mentor_message_limit: i32,
    /// 是否已捐赠（捐赠用户不受配额限制）
    pub is_donor: bool,
}
