use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use super::{errors::DomainError, score::Score};

/// 照片 ID 值对象
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct PhotoId(pub String);

impl PhotoId {
    pub fn new(id: String) -> Self {
        Self(id)
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// 照片实体
/// 封装照片的核心业务行为和不变量
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Photo {
    pub id: PhotoId,
    pub filename: String,
    pub score: Option<Score>,
    pub review: Option<String>,
    pub uploaded_at: DateTime<Utc>,
    pub engine: Option<String>,
}

impl Photo {
    pub fn new(id: PhotoId, filename: String) -> Self {
        Self {
            id,
            filename,
            score: None,
            review: None,
            uploaded_at: Utc::now(),
            engine: None,
        }
    }

    /// 分配评分（核心业务行为）
    pub fn assign_score(&mut self, score: Score, engine: String) -> Result<(), DomainError> {
        if self.score.is_some() {
            // 允许重新评分，记录日志即可
            // 在真实场景中可能需要更复杂的重评逻辑
        }
        self.score = Some(score.clone());
        self.review = Some(score.review().to_string());
        self.engine = Some(engine);
        Ok(())
    }

    pub fn is_scored(&self) -> bool {
        self.score.is_some()
    }

    pub fn score_value(&self) -> Option<f32> {
        self.score.as_ref().map(|s| s.value())
    }

    /// 构建照片的公开 URL（消除 URL 构建的重复）
    pub fn url(&self, base_url: &str) -> String {
        format!("{}/uploads/{}.jpg", base_url, self.id.as_str())
    }

    /// 构建存储路径（消除路径构建的重复）
    pub fn storage_path(&self, upload_dir: &std::path::Path) -> std::path::PathBuf {
        upload_dir.join(format!("{}.jpg", self.id.as_str()))
    }
}
