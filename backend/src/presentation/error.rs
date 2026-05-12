use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

use crate::domain::errors::DomainError;

/// 表现层错误类型
///
/// 将领域错误（DomainError）和 HTTP 层错误统一为表现层错误，
/// 确保领域层不依赖 HTTP 概念，同时所有 HTTP 状态码映射集中在一处。
/// 表现层错误类型
///
/// 将领域错误（DomainError）统一转为 HTTP 响应，
/// 确保领域层不依赖 HTTP 概念，所有状态码映射集中在一处。
pub enum ApiError {
    /// 领域层错误（自动从 DomainError 转换）
    Domain(DomainError),
    /// 外部服务错误（如 Stripe API 调用失败）
    External(String),
    /// 配额/频率限制
    RateLimited(String),
}

impl From<DomainError> for ApiError {
    fn from(err: DomainError) -> Self {
        ApiError::Domain(err)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_msg) = match self {
            ApiError::External(msg) => (StatusCode::BAD_GATEWAY, msg),
            ApiError::RateLimited(msg) => (StatusCode::TOO_MANY_REQUESTS, msg),
            ApiError::Domain(err) => match err {
                DomainError::FileTooLarge { .. } => {
                    (StatusCode::PAYLOAD_TOO_LARGE, err.to_string())
                }
                DomainError::InvalidFileFormat(_) => {
                    (StatusCode::UNSUPPORTED_MEDIA_TYPE, err.to_string())
                }
                DomainError::PhotoNotFound(_) => (StatusCode::NOT_FOUND, err.to_string()),
                DomainError::MissingFile | DomainError::MultipartError(_) => {
                    (StatusCode::BAD_REQUEST, err.to_string())
                }
                DomainError::AlreadyScored => (StatusCode::CONFLICT, err.to_string()),
                _ => (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()),
            },
        };

        (status, Json(json!({ "error": error_msg }))).into_response()
    }
}
