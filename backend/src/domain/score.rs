use serde::{Deserialize, Serialize};

use super::errors::DomainError;

/// 评分值对象
/// 封装评分的验证和归一化逻辑，消除评分处理中的重复
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Score {
    value: f32,
    review: String,
}

impl Score {
    pub const MIN: f32 = 0.0;
    pub const MAX: f32 = 5.0;
    /// 收录到画廊的最低评分阈值
    pub const GALLERY_THRESHOLD: f32 = 3.8;

    pub fn new(value: f32, review: String) -> Result<Self, DomainError> {
        if value.is_nan() || value.is_infinite() {
            return Err(DomainError::InvalidScore(format!(
                "Score must be a finite number, got {}",
                value
            )));
        }
        let clamped = value.clamp(Self::MIN, Self::MAX);
        Ok(Self {
            value: clamped,
            review,
        })
    }

    /// 从 0-100 原始分数归一化到 0-5
    pub fn from_raw(raw: f32, review: String) -> Result<Self, DomainError> {
        Self::new(raw / 20.0, review)
    }

    pub fn value(&self) -> f32 {
        self.value
    }

    pub fn review(&self) -> &str {
        &self.review
    }

    pub fn is_excellent(&self) -> bool {
        self.value >= 4.0
    }

    pub fn is_good(&self) -> bool {
        self.value >= 3.0
    }
}
