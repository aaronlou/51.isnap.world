use crate::domain::{errors::DomainError, repository::FileStorage};

/// 本地文件系统存储实现
#[derive(Clone)]
pub struct LocalFileStorage;

#[async_trait::async_trait]
impl FileStorage for LocalFileStorage {
    async fn write(&self, path: &std::path::Path, data: &[u8]) -> Result<(), DomainError> {
        tokio::fs::write(path, data)
            .await
            .map_err(|e| DomainError::StorageError(format!("Failed to write file: {}", e)))
    }

    async fn read(&self, path: &std::path::Path) -> Result<Vec<u8>, DomainError> {
        tokio::fs::read(path)
            .await
            .map_err(|e| DomainError::StorageError(format!("Failed to read file: {}", e)))
    }

    async fn exists(&self, path: &std::path::Path) -> bool {
        tokio::fs::try_exists(path).await.unwrap_or(false)
    }

    async fn delete(&self, path: &std::path::Path) -> Result<(), DomainError> {
        tokio::fs::remove_file(path)
            .await
            .map_err(|e| DomainError::StorageError(format!("Failed to delete file: {}", e)))
    }
}
