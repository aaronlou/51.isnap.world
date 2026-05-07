use tracing::info;

use crate::application::dto::PhotoDto;
use crate::domain::{
    errors::DomainError,
    file::FileUpload,
    photo::{Photo, PhotoId},
    repository::{FileStorage, PhotoRepository},
};

/// 上传照片用例
/// 协调文件验证、存储、持久化，不包含业务规则（规则在领域层）
pub struct UploadPhotoUseCase<R: PhotoRepository, S: FileStorage> {
    repository: R,
    file_storage: S,
    upload_dir: std::path::PathBuf,
    base_url: String,
}

impl<R: PhotoRepository, S: FileStorage> UploadPhotoUseCase<R, S> {
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

    pub async fn execute(&self, filename: String, data: Vec<u8>) -> Result<PhotoDto, DomainError> {
        // 1. 领域层验证（值对象封装验证逻辑）
        let file = FileUpload::validate(filename, data)?;

        // 2. 创建领域实体
        let id = PhotoId::new(uuid::Uuid::new_v4().to_string());
        let photo = Photo::new(id, file.filename);

        // 3. 存储文件（通过端口抽象，不依赖具体文件系统）
        let path = photo.storage_path(&self.upload_dir);
        self.file_storage.write(&path, &file.data).await?;
        info!("File saved to {}", path.display());
        // 4. 持久化实体
        self.repository.save(&photo).await?;

        // 5. 返回 DTO
        Ok(PhotoDto::from_photo(&photo, &self.base_url))
    }
}
