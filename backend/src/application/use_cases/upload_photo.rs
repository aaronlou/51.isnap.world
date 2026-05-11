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

    pub async fn execute(&self, filename: String, data: Vec<u8>, is_battle: bool) -> Result<PhotoDto, DomainError> {
        // 1. 领域层验证（值对象封装验证逻辑）
        let file = FileUpload::validate(filename, data)?;

        // 2. 创建领域实体
        let id = PhotoId::new(uuid::Uuid::new_v4().to_string());
        let photo = if is_battle {
            Photo::new_battle(id, file.filename)
        } else {
            Photo::new(id, file.filename)
        };

        // 3. 存储文件（通过端口抽象，不依赖具体文件系统）
        let path = photo.storage_path(&self.upload_dir);
        self.file_storage.write(&path, &file.data).await?;
        info!("File saved to {}", path.display());

        // 4. 生成缩略图（300px 宽，加速 Gallery 加载）
        let thumb_dir = self.upload_dir.join("thumbnails");
        std::fs::create_dir_all(&thumb_dir).ok();
        let thumb_path = thumb_dir.join(format!("{}.jpg", photo.id.as_str()));
        match image::load_from_memory(&file.data) {
            Ok(img) => {
                let thumb = img.thumbnail(300, 300);
                let thumb_data = thumb.to_rgb8();
                match thumb_data.save(&thumb_path) {
                    Ok(_) => info!("Thumbnail saved to {}", thumb_path.display()),
                    Err(e) => tracing::warn!("Failed to save thumbnail: {}", e),
                }
            }
            Err(e) => tracing::warn!("Failed to generate thumbnail: {}", e),
        }

        // 5. 持久化实体
        self.repository.save(&photo).await?;

        // 5. 返回 DTO
        Ok(PhotoDto::from_photo(&photo, &self.base_url))
    }
}
