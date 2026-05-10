use crate::infrastructure::http::unsplash_client::UnsplashClient;

/// 获取随机 Unsplash 照片用例
pub struct GetRandomUnsplashUseCase {
    unsplash: UnsplashClient,
}

impl GetRandomUnsplashUseCase {
    pub fn new(unsplash: UnsplashClient) -> Self {
        Self { unsplash }
    }

    pub async fn execute(&self) -> Result<UnsplashPhotoDto, crate::domain::errors::DomainError> {
        let photo = self.unsplash.fetch_random().await?;
        Ok(UnsplashPhotoDto {
            id: photo.id,
            url: photo.display_url,
            title: photo.title,
            photographer: photo.photographer,
            photographer_link: photo.photographer_link,
        })
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct UnsplashPhotoDto {
    pub id: String,
    pub url: String,
    pub title: String,
    pub photographer: String,
    pub photographer_link: String,
}
