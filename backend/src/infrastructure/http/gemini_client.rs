use std::path::Path;
use std::time::Duration;

use base64::{engine::general_purpose::STANDARD, Engine};

use crate::domain::{errors::DomainError, score::Score, scoring::ScoringEngine};

const GEMINI_API_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

const PROMPT: &str = r#"你是一位专业摄影评论家。请仔细分析这张照片的实际内容，给出真实的评价。不要给安全分，不要对所有照片都给相似分数。

请给出：
1. 0.0 到 5.0 的评分（一位小数即可，如 2.5、4.2）
2. 一段 50-100 字的中文点评，具体指出这张照片的构图、光线、色彩、主体表达等方面的真实优缺点。

请严格按照以下 JSON 格式回复：
{"score": X.X, "review": "你的点评内容"}

评分参考标准（根据照片实际质量灵活使用，不要机械套用）：
- 4.5-5.0：极少数的杰作。具有强烈的视觉冲击力和艺术独创性。
- 3.8-4.4：优秀作品。技术成熟，有明显的艺术表达，让人印象深刻。
- 3.0-3.7：合格作品。有基本美感，能看到拍摄者的用心，但有改进空间。
- 2.0-2.9：有明显短板。构图、曝光、对焦或主体表达上存在需要正视的问题。
- 1.0-1.9：问题较多。多个维度表现不佳，需要系统学习基础。
- 0.0-0.9：极少数的失误。存在导致照片无法观看的致命错误。

最重要的要求：
1. 分数必须反映这张照片的真实质量，不要给"安全分"。
2. 点评必须与分数一致：高分就真诚夸奖优点，低分就指出具体问题。
3. 不同照片应该有不同的分数，哪怕是细微差异。"#;

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
        let image_data =
            std::fs::read(image_path).map_err(|e| DomainError::StorageError(e.to_string()))?;
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

        let mut client_builder = reqwest::Client::builder().timeout(Duration::from_secs(30));

        // 支持 HTTPS_PROXY 环境变量（用于需要代理的网络环境）
        if let Ok(proxy_url) =
            std::env::var("HTTPS_PROXY").or_else(|_| std::env::var("https_proxy"))
        {
            if let Ok(proxy) = reqwest::Proxy::https(&proxy_url) {
                client_builder = client_builder.proxy(proxy);
                tracing::info!("Using HTTPS proxy for Gemini API");
            }
        }

        let client = client_builder.build().map_err(|e| {
            DomainError::EngineUnavailable(format!("Failed to build HTTP client: {}", e))
        })?;

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
    if let Some(inner) = text
        .split("```json")
        .nth(1)
        .and_then(|s| s.split("```").next())
    {
        inner.trim().to_string()
    } else if let Some(inner) = text.split("```").nth(1) {
        inner.trim().to_string()
    } else {
        text.trim().to_string()
    }
}
