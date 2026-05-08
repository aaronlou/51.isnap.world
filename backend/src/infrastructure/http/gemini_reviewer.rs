use std::path::Path;

use base64::{engine::general_purpose::STANDARD, Engine};

use crate::domain::{errors::DomainError, review::ReviewGenerator};

const GEMINI_API_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

const PROMPT: &str = r#"You are a professional photography critic. Analyze this photo and write a concise review covering composition, lighting, color, subject, technical execution, and emotional impact.

The image has been scored __SCORE__/5 by an aesthetic model. Based on what you see, write an insightful review (80-120 words in Chinese) that references specific qualities of this image.

Review:"#;

pub struct GeminiReviewer {
    api_key: String,
}

impl GeminiReviewer {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }
}

#[async_trait::async_trait]
impl ReviewGenerator for GeminiReviewer {
    async fn generate_review(&self, image_path: &Path, score: f32) -> Result<String, DomainError> {
        let image_data =
            std::fs::read(image_path).map_err(|e| DomainError::StorageError(e.to_string()))?;

        let base64_image = STANDARD.encode(&image_data);
        let prompt = PROMPT.replace("__SCORE__", &format!("{:.1}", score));

        let request_body = serde_json::json!({
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64_image
                        }
                    }
                ]
            }]
        });

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .map_err(|e| {
                DomainError::EngineUnavailable(format!("Failed to build HTTP client: {}", e))
            })?;

        let response = client
            .post(format!("{}?key={}", GEMINI_API_URL, self.api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| {
                DomainError::EngineUnavailable(format!("Gemini review request failed: {}", e))
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(DomainError::EngineUnavailable(format!(
                "Gemini review returned {}: {}",
                status, text
            )));
        }

        let gemini_resp: serde_json::Value = response.json().await.map_err(|e| {
            DomainError::EngineUnavailable(format!("Parse error: {}", e))
        })?;

        let text = gemini_resp["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .unwrap_or("");

        Ok(text.trim().to_string())
    }
}
