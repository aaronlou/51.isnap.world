use std::path::Path;
use std::time::Duration;

use base64::{engine::general_purpose::STANDARD, Engine};

use crate::domain::{errors::DomainError, score::Score, scoring::ScoringEngine};

const GEMINI_API_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

const PROMPT: &str = r#"你是一位严厉的专业摄影评论家，评分标准必须拉开差距。分析这张照片，请给出：
1. 0.00 到 5.00 的评分（保留两位小数，5.00 分为传世大师级）
2. 一段 50-100 字的中文点评，涵盖构图、光线、主体和情感等角度。

请严格按照以下 JSON 格式回复：
{"score": X.XX, "review": "你的点评内容"}

评分必须使用完整的 0.00-5.00 范围，严禁压缩在中间区间。各档位标准如下：
- 4.50-5.00：传世之作。构图精妙绝伦，光影极具艺术性，情感表达深刻，具有独创性和视觉冲击力。
- 3.80-4.49：优秀专业作品。技术执行出色，有明显的艺术追求和审美高度，在摄影比赛中有竞争力。
- 3.00-3.79：良好作品。有基本的美感和技术功底，但缺乏亮点或存在可改进之处。
- 2.00-2.99：有明显不足。构图、光线、色彩或主体表达中存在明显问题，技术执行有瑕疵。
- 1.00-1.99：缺陷较多。多个维度表现不佳，缺乏基本的摄影意识或技术能力。
- 0.00-0.99：严重失败。存在致命的技术错误（如严重失焦、极端过曝/欠曝、无意义构图）。

点评必须与你给出的分数严格一致，这是最重要的要求：
- 如果你给了 4.0 分以上，点评应该充分肯定作品的优点，明确指出它出色的地方（如"构图大胆而富有张力，光影层次丰富"），可以附带少量精进建议。
- 如果你给了 3.0-3.9 分，点评应该客观平衡，既指出作品的亮点，也指出明显的不足和改进方向。
- 如果你给了 2.0-2.9 分，点评应该聚焦于问题（如"主体不够突出，背景杂乱分散注意力"），但可以提及一两个可取之处。
- 如果你给了 2.0 分以下，点评应该直接指出致命缺陷（如"严重失焦导致主体模糊""极端过曝丢失全部细节"），语气可以严厉但保持专业。

严禁出现以下背离情况：给 4.0+ 高分却通篇挑刺，或给 2.0+ 低分却大量夸奖。点评的整体态度必须与分数相匹配。

尽可能从摄影美学、技术水平等多个维度进行评分。能讲出作品好在地方，也能指出还有哪些地方可以提升，而且是有可操作性的指导建议，而不是大空话。
请务必将分数拉开差距：优秀的照片敢于给高分，有明显问题的照片敢于给低分。平庸的"还可以"照片应该落在 2.50-3.20 区间，而不是挤在 3.00-3.50。不要给出 3.30、3.40、3.50 这种扎堆的中间值。"#;

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
