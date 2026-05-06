use crate::application::dto::PhotoDto;
use crate::domain::{errors::DomainError, repository::PhotoRepository};

/// 获取排行榜用例
pub struct GetLeaderboardUseCase<R: PhotoRepository> {
    repository: R,
    base_url: String,
}

impl<R: PhotoRepository> GetLeaderboardUseCase<R> {
    pub fn new(repository: R, base_url: String) -> Self {
        Self {
            repository,
            base_url,
        }
    }

    pub async fn execute(&self) -> Result<Vec<PhotoDto>, DomainError> {
        let photos = self.repository.list_top_scored(3).await?;
        Ok(photos
            .into_iter()
            .map(|p| PhotoDto::from_photo(&p, &self.base_url))
            .collect())
    }
}
