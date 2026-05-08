use crate::application::dto::ScoreResultDto;
use crate::domain::{
    errors::DomainError, photo::PhotoId, repository::PhotoRepository, scoring::ScoringCoordinator,
};

/// 照片评分用例
/// 协调评分引擎调用、领域实体状态更新、持久化
pub struct ScorePhotoUseCase<R: PhotoRepository> {
    repository: R,
    upload_dir: std::path::PathBuf,
    coordinator: ScoringCoordinator,
}

impl<R: PhotoRepository> ScorePhotoUseCase<R> {
    pub fn new(
        repository: R,
        upload_dir: std::path::PathBuf,
        coordinator: ScoringCoordinator,
    ) -> Self {
        Self {
            repository,
            upload_dir,
            coordinator,
        }
    }

    pub async fn execute(&self, photo_id: &str) -> Result<ScoreResultDto, DomainError> {
        let id = PhotoId::new(photo_id.to_string());

        // 1. 查找照片
        let mut photo = self
            .repository
            .find_by_id(&id)
            .await?
            .ok_or_else(|| DomainError::PhotoNotFound(photo_id.to_string()))?;
        tracing::info!("找到了 photo: {}", photo_id.to_string());
        // 2. 调用评分引擎（通过协调器）
        let image_path = photo.storage_path(&self.upload_dir);
        let (score, engine_name) = self.coordinator.score(&image_path).await?;

        // 3. 领域实体执行业务行为
        photo.assign_score(score.clone(), engine_name.to_string())?;

        // 4. 持久化更新
        self.repository.save(&photo).await?;

        // 5. 返回 DTO
        Ok(ScoreResultDto {
            id: photo_id.to_string(),
            score: score.value(),
            review: score.review().to_string(),
            engine: Some(engine_name.to_string()),
        })
    }
}
