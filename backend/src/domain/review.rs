use std::path::Path;

use super::errors::DomainError;

/// 点评生成器接口（领域层定义，基础设施层实现）
#[async_trait::async_trait]
pub trait ReviewGenerator: Send + Sync {
    /// 对指定图片生成多维度摄影点评
    async fn generate_review(&self, image_path: &Path, score: f32) -> Result<String, DomainError>;
}
