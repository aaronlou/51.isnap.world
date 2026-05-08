use tracing::info;

use crate::application::dto::PhotoDto;
use crate::domain::{
    errors::DomainError,
    photo::PhotoId,
    repository::{FileStorage, PhotoRepository},
};

/// 删除照片用例
/// 协调数据库记录删除与文件清理
pub struct DeletePhotoUseCase<R: PhotoRepository, S: FileStorage> {
    repository: R,
    file_storage: S,
    upload_dir: std::path::PathBuf,
    base_url: String,
}

impl<R: PhotoRepository, S: FileStorage> DeletePhotoUseCase<R, S> {
    pub fn new(
        repository: R,
        file_storage: S,
        upload_dir: std::path::PathBuf,
        base_url: String,
    ) -> Self {
        Self {
            repository,
            file_storage,
            upload_dir,
            base_url,
        }
    }

    pub async fn execute(&self, id: &str) -> Result<PhotoDto, DomainError> {
        let photo_id = PhotoId::new(id.to_string());

        // 1. 确认照片存在
        let photo = self
            .repository
            .find_by_id(&photo_id)
            .await?
            .ok_or_else(|| DomainError::PhotoNotFound(id.to_string()))?;

        // 2. 删除数据库记录
        self.repository.delete(&photo_id).await?;
        info!("Photo record deleted from DB: {}", id);

        // 3. 删除原始图片文件
        let storage_path = photo.storage_path(&self.upload_dir);
        if self.file_storage.exists(&storage_path).await {
            self.file_storage.delete(&storage_path).await?;
            info!("Original image deleted: {}", storage_path.display());
        }

        // 4. 删除缩略图
        let thumb_path = self
            .upload_dir
            .join("thumbnails")
            .join(format!("{}.jpg", photo.id.as_str()));
        if self.file_storage.exists(&thumb_path).await {
            self.file_storage.delete(&thumb_path).await?;
            info!("Thumbnail deleted: {}", thumb_path.display());
        }

        // 5. 返回被删除照片的 DTO（前端可用于撤销提示等）
        Ok(PhotoDto::from_photo(&photo, &self.base_url))
    }
}
