use std::time::Duration;

use crate::domain::errors::DomainError;

const UNSPLASH_API_URL: &str = "https://api.unsplash.com/photos/random";

/// Unsplash 随机照片信息
#[derive(Debug, Clone)]
pub struct UnsplashPhoto {
    pub id: String,
    /// 适合前端展示的图片 URL（1080px 宽）
    pub display_url: String,
    /// 适合 AI 分析的高清 URL
    pub hd_url: String,
    pub title: String,
    pub photographer: String,
    pub photographer_link: String,
}

#[derive(Clone)]
pub struct UnsplashClient {
    client_id: String,
}

impl UnsplashClient {
    pub fn new(client_id: String) -> Self {
        Self { client_id }
    }

    pub async fn fetch_random(&self) -> Result<UnsplashPhoto, DomainError> {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .map_err(|e| DomainError::EngineUnavailable(format!("HTTP client build failed: {}", e)))?;

        let response = client
            .get(format!("{}?client_id={}", UNSPLASH_API_URL, self.client_id))
            .send()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Unsplash request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(DomainError::EngineUnavailable(format!(
                "Unsplash returned {}: {}",
                status, text
            )));
        }

        let data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Unsplash parse error: {}", e)))?;

        let id = data["id"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let display_url = data["urls"]["regular"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let hd_url = data["urls"]["full"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let title = data["description"]
            .as_str()
            .or_else(|| data["alt_description"].as_str())
            .unwrap_or("Untitled")
            .to_string();

        let photographer = data["user"]["name"]
            .as_str()
            .unwrap_or("Unknown")
            .to_string();

        let photographer_link = data["links"]["html"]
            .as_str()
            .unwrap_or("")
            .to_string();

        if id.is_empty() || display_url.is_empty() {
            return Err(DomainError::EngineUnavailable(
                "Unsplash returned incomplete photo data".to_string(),
            ));
        }

        Ok(UnsplashPhoto {
            id,
            display_url,
            hd_url,
            title,
            photographer,
            photographer_link,
        })
    }

    /// 下载 Unsplash 图片 bytes，用于传给 AI 引擎
    pub async fn download_photo(&self, url: &str) -> Result<Vec<u8>, DomainError> {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(20))
            .build()
            .map_err(|e| DomainError::EngineUnavailable(format!("HTTP client build failed: {}", e)))?;

        let response = client
            .get(url)
            .send()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Download failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(DomainError::EngineUnavailable(format!(
                "Download returned {}",
                response.status()
            )));
        }

        let bytes = response
            .bytes()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Download read failed: {}", e)))?;

        Ok(bytes.to_vec())
    }
}
