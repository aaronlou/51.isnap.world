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

        // 2. 所有引擎评分并取平均
        let image_path = photo.storage_path(&self.upload_dir);
        let (mut score, engine_label) = self.coordinator.score_averaged(&image_path).await?;

        // 3. 若 Gemini 未参与评分（引擎不含 gemini），用 Reviewer 补充点评
        let needs_review = !engine_label.contains("gemini");
        if let Some(ref reviewer) = self.reviewer {
            if needs_review {
                match reviewer.generate_review(&image_path, score.value()).await {
                    Ok(review_text) => {
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
        photo.assign_score(score.clone(), engine_label.clone())?;

        // 5. 判断是否达到画廊收录标准
        let accepted = score.value() >= crate::domain::score::Score::GALLERY_THRESHOLD;

        if accepted {
            // 5a. 达标：持久化更新
            self.repository.save(&photo).await?;
        } else {
            // 5b. 未达标：从数据库和文件系统中清理，避免占用存储
            self.repository.delete(&id).await?;
            tracing::info!("Photo {} scored {:.1}, below threshold {:.1}, deleted", photo_id, score.value(), crate::domain::score::Score::GALLERY_THRESHOLD);

            // 删除原始图片
            let storage_path = photo.storage_path(&self.upload_dir);
            if storage_path.exists() {
                if let Err(e) = std::fs::remove_file(&storage_path) {
                    tracing::warn!("Failed to delete original image {}: {}", storage_path.display(), e);
                }
            }

            // 删除缩略图
            let thumb_path = self
                .upload_dir
                .join("thumbnails")
                .join(format!("{}.jpg", photo.id.as_str()));
            if thumb_path.exists() {
                if let Err(e) = std::fs::remove_file(&thumb_path) {
                    tracing::warn!("Failed to delete thumbnail {}: {}", thumb_path.display(), e);
                }
            }
        }

        // 6. 返回 DTO
        Ok(ScoreResultDto {
            id: photo_id.to_string(),
            score: score.value(),
            review: score.review().to_string(),
            engine: Some(engine_label),
            accepted,
            personal_stats: None,
        })
    }
}
