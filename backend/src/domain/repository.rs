use super::photo::{Photo, PhotoId};

/// 照片仓库接口（领域层定义，基础设施层实现）
/// 消除数据库操作与业务逻辑的耦合
#[async_trait::async_trait]
pub trait PhotoRepository: Send + Sync {
    async fn save(&self, photo: &Photo) -> Result<(), crate::domain::errors::DomainError>;
    async fn find_by_id(&self, id: &PhotoId) -> Result<Option<Photo>, crate::domain::errors::DomainError>;
    async fn list_all(&self) -> Result<Vec<Photo>, crate::domain::errors::DomainError>;
    async fn list_top_scored(&self, limit: usize) -> Result<Vec<Photo>, crate::domain::errors::DomainError>;
}

/// 文件存储端口（领域层定义，基础设施层实现）
/// 消除用例层对具体文件系统的直接依赖
#[async_trait::async_trait]
pub trait FileStorage: Send + Sync {
    async fn write(&self, path: &std::path::Path, data: &[u8]) -> Result<(), crate::domain::errors::DomainError>;
    async fn read(&self, path: &std::path::Path) -> Result<Vec<u8>, crate::domain::errors::DomainError>;
    async fn exists(&self, path: &std::path::Path) -> bool;
}
