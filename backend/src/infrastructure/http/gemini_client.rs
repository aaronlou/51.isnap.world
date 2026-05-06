use std::path::Path;
use std::time::Duration;

use base64::{engine::general_purpose::STANDARD, Engine};

use crate::domain::{errors::DomainError, score::Score, scoring::ScoringEngine};

const GEMINI_API_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent";

const PROMPT: &str = r#"You are a professional photography critic. Analyze this photo and provide:
1. A score from 0.0 to 5.0 (5 being masterpiece level)
2. A brief but insightful review (50-100 words) covering composition, lighting, subject, and emotional impact.

Respond in this exact JSON format:
{"score": X.X, "review": "your review here"}

Be critical but fair. Most good amateur photos score 2.5-3.5. Exceptional works score 4.0+. Only truly world-class photos deserve 4.5+."#;

pub struct GeminiClient {
    api_key: String,
}

impl GeminiClient {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }
}

#[async_trait::async_trait]
impl ScoringEngine for GeminiClient {
    fn name(&self) -> &'static str {
        "gemini"
    }

    async fn score(&self, image_path: &Path) -> Result<Score, DomainError> {
        let image_data = std::fs::read(image_path)
            .map_err(|e| DomainError::StorageError(e.to_string()))?;
        let base64_image = STANDARD.encode(&image_data);

        let request_body = serde_json::json!({
            "contents": [{
                "parts": [
                    {"text": PROMPT},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64_image
                        }
                    }
                ]
            }]
        });

        let mut client_builder = reqwest::Client::builder()
            .timeout(Duration::from_secs(30));

        // 支持 HTTPS_PROXY 环境变量（用于需要代理的网络环境）
        if let Ok(proxy_url) = std::env::var("HTTPS_PROXY")
            .or_else(|_| std::env::var("https_proxy"))
        {
            if let Ok(proxy) = reqwest::Proxy::https(&proxy_url) {
                client_builder = client_builder.proxy(proxy);
                tracing::info!("Using HTTPS proxy for Gemini API");
            }
        }

        let client = client_builder
            .build()
            .map_err(|e| DomainError::EngineUnavailable(format!("Failed to build HTTP client: {}", e)))?;

        let response = client
            .post(format!("{}?key={}", GEMINI_API_URL, self.api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Gemini request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(DomainError::EngineUnavailable(format!(
                "Gemini returned {}: {}",
                status, text
            )));
        }

        let gemini_resp: serde_json::Value = response
            .json()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Parse error: {}", e)))?;

        // 防腐层（ACL）：将 Gemini 外部 API 响应转为领域 Score
        let parsed = GeminiResponse::from_raw(&gemini_resp)?;
        parsed.to_domain_score()
    }
}

/// 防腐层（ACL）：Gemini 外部响应结构 → 领域 Score
///
/// 封装 Gemini API 的响应结构知识，隔离外部 schema 变动对领域层的影响。
/// 若 Gemini 升级 API（改变 JSON 路径），只需修改此结构体。
struct GeminiResponse {
    score: f32,
    review: String,
}

impl GeminiResponse {
    /// 从 Gemini API 原始 JSON 中提取评分和点评
    fn from_raw(value: &serde_json::Value) -> Result<Self, DomainError> {
        let text = value["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .unwrap_or("{}");

        let json_text = extract_json_from_markdown(text);

        let parsed: serde_json::Value = serde_json::from_str(&json_text).map_err(|e| {
            DomainError::EngineUnavailable(format!("JSON parse error: {} | text: {}", e, text))
        })?;

        let score = parsed["score"].as_f64().unwrap_or(3.0) as f32;
        let review = parsed["review"]
            .as_str()
            .unwrap_or("No review available")
            .to_string();

        Ok(Self { score, review })
    }

    /// 转换为领域 Score 值对象（包含验证和归一化）
    fn to_domain_score(self) -> Result<Score, DomainError> {
        Score::new(self.score, self.review)
    }
}

/// 从 Markdown 代码块中提取 JSON（消除 Gemini 和 ArtiMuse 中重复的逻辑）
pub fn extract_json_from_markdown(text: &str) -> String {
    if let Some(inner) = text.split("```json").nth(1).and_then(|s| s.split("```").next()) {
        inner.trim().to_string()
    } else if let Some(inner) = text.split("```").nth(1) {
        inner.trim().to_string()
    } else {
        text.trim().to_string()
    }
}
