use axum::{
    extract::{State, Json},
    http::HeaderMap,
    response::{IntoResponse, Json as AxumJson},
};
use chrono::Utc;
use serde_json;
use std::sync::Arc;

use crate::application::dto::{
    MentorChatMessageDto, MentorChatRequestDto, MentorChatResponseDto,
};
use crate::domain::errors::DomainError;
use crate::domain::repository::PhotoRepository;
use crate::infrastructure::http::gemini_mentor::{GeminiMentor, MentorMessage};
use crate::presentation::error::ApiError;
use crate::AppState;

const DAILY_MENTOR_LIMIT: i32 = 3;

pub async fn get_mentor_chat(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    axum::extract::Path(photo_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let user_id = headers
        .get("X-User-ID")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let Some(uid) = user_id else {
        return Err(ApiError::External("X-User-ID required".to_string()));
    };

    let chat = state.repository.get_or_create_mentor_chat(&uid, &photo_id).await?;
    let messages: Vec<MentorChatMessageDto> = serde_json::from_str(&chat.messages)
        .unwrap_or_default();

    Ok(AxumJson(serde_json::json!({
        "messages": messages,
        "message_count": chat.message_count,
    })))
}

pub async fn post_mentor_chat(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    axum::extract::Path(photo_id): axum::extract::Path<String>,
    Json(payload): Json<MentorChatRequestDto>,
) -> Result<impl IntoResponse, ApiError> {
    let user_id = headers
        .get("X-User-ID")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let Some(uid) = user_id else {
        return Err(ApiError::External("X-User-ID required".to_string()));
    };

    // 确保用户存在
    state.repository.ensure_user(&uid).await?;

    // 检查每日配额（捐赠用户跳过限制）
    let is_donor = state.repository.has_donated(&uid).await.unwrap_or(false);
    let (_, usage_today) = state.repository.get_mentor_chat_usage(&uid).await?;
    if !is_donor && usage_today >= DAILY_MENTOR_LIMIT {
        return Err(ApiError::External(
            "DAILY_LIMIT_REACHED: 今日的免费导师对话次数已用完。支持我们即可无限畅聊！".to_string()
        ));
    }

    // 查找照片
    let photo = state.repository.find_by_id(&crate::domain::photo::PhotoId::new(photo_id.clone())).await?;
    let photo = match photo {
        Some(p) => p,
        None => return Err(ApiError::Domain(DomainError::PhotoNotFound(photo_id))),
    };

    // 获取对话历史
    let chat = state.repository.get_or_create_mentor_chat(&uid, &photo_id).await?;
    let mut history: Vec<MentorMessage> = if chat.messages.is_empty() || chat.messages == "[]" {
        vec![]
    } else {
        // 从数据库读取的是 MentorChatMessageDto 数组，转换为 MentorMessage
        let dtos: Vec<MentorChatMessageDto> = serde_json::from_str(&chat.messages).unwrap_or_default();
        dtos.into_iter().map(|d| MentorMessage {
            role: d.role,
            content: d.content,
        }).collect()
    };

    // 读取图片路径
    let image_path = photo.storage_path(&state.upload_photo.upload_dir());

    // 调用 Gemini Mentor
    let mentor = GeminiMentor::new(state.gemini_api_key.clone());
    let reply = mentor.chat(&image_path, &history, &payload.message).await?;

    // 更新使用量
    let new_usage = state.repository.increment_mentor_chat_usage(&uid).await?;
    let remaining = (DAILY_MENTOR_LIMIT - new_usage).max(0);

    // 保存消息到历史
    let now = Utc::now().to_rfc3339();
    history.push(MentorMessage {
        role: "user".to_string(),
        content: payload.message,
    });
    history.push(MentorMessage {
        role: "model".to_string(),
        content: reply.clone(),
    });

    let messages_dto: Vec<MentorChatMessageDto> = history.iter().map(|m| MentorChatMessageDto {
        role: m.role.clone(),
        content: m.content.clone(),
        created_at: now.clone(),
    }).collect();

    let messages_json = serde_json::to_string(&messages_dto)
        .unwrap_or_else(|_| "[]".to_string());
    state.repository.append_mentor_chat_message(
        &uid,
        &photo_id,
        &messages_json,
        history.len() as i32 / 2, // 每两条消息算一轮（user + model）
    ).await?;

    Ok(AxumJson(MentorChatResponseDto {
        reply,
        remaining,
        messages: messages_dto,
    }))
}
