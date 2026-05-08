use crate::application::dto::ScoreResultDto;
use crate::domain::{
    errors::DomainError,
    photo::PhotoId,
    repository::PhotoRepository,
    review::ReviewGenerator,
    scoring::ScoringCoordinator,
};

/// 照片评分用例
/// 协调评分引擎调用、领域实体状态更新、持久化
pub struct ScorePhotoUseCase<R: PhotoRepository> {
    repository: R,
    upload_dir: std::path::PathBuf,
    coordinator: ScoringCoordinator,
    reviewer: Option<Box<dyn ReviewGenerator>>,
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
            reviewer: None,
        }
    }

    pub fn with_reviewer(mut self, reviewer: Box<dyn ReviewGenerator>) -> Self {
        self.reviewer = Some(reviewer);
        self
    }

    pub async fn execute(&self, photo_id: &str) -> Result<ScoreResultDto, DomainError> {
        let id = PhotoId::new(photo_id.to_string());

        // 1. 查找照片
        let mut photo = self
            .repository
            .find_by_id(&id)
            .await?
            .ok_or_else(|| DomainError::PhotoNotFound(photo_id.to_string()))?;

        // 2. 调用评分引擎（通过协调器）
        let image_path = photo.storage_path(&self.upload_dir);
        let (mut score, engine_name) = self.coordinator.score(&image_path).await?;

        // 3. 若评分引擎不是 AI 引擎且有 Reviewer 则生成点评
        if let Some(ref reviewer) = self.reviewer {
            if engine_name != "gemini" && engine_name != "artimuse" {
                match reviewer.generate_review(&image_path, score.value()).await {
                    Ok(review_text) => {
                        // 用 AI 生成的点评替换引擎的简单评价
                        score = crate::domain::score::Score::new(score.value(), review_text)
                            .unwrap_or(score);
                    }
                    Err(e) => {
                        tracing::warn!("Review generation failed: {}, using engine review", e);
                    }
                }
            }
        }

        // 4. 领域实体执行业务行为
        photo.assign_score(score.clone(), engine_name.to_string())?;

        // 5. 持久化更新
        self.repository.save(&photo).await?;

        // 6. 返回 DTO
        Ok(ScoreResultDto {
            id: photo_id.to_string(),
            score: score.value(),
            review: score.review().to_string(),
            engine: Some(engine_name.to_string()),
        })
    }
}
