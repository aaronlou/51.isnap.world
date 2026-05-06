use std::path::Path;

use crate::domain::{errors::DomainError, score::Score, scoring::ScoringEngine};

pub struct ArtiMuseClient {
    api_url: String,
}

impl ArtiMuseClient {
    pub fn new(api_url: String) -> Self {
        Self { api_url }
    }
}

#[async_trait::async_trait]
impl ScoringEngine for ArtiMuseClient {
    fn name(&self) -> &'static str {
        "artimuse"
    }

    async fn score(&self, image_path: &Path) -> Result<Score, DomainError> {
        let client = reqwest::Client::new();
        let request_body = serde_json::json!({
            "image_path": image_path.to_str().unwrap_or("")
        });

        let response = client
            .post(format!("{}/score", self.api_url))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("ArtiMuse request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(DomainError::EngineUnavailable(format!(
                "ArtiMuse returned {}: {}",
                status, text
            )));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Parse error: {}", e)))?;

        // 防腐层（ACL）：将 ArtiMuse 外部响应转为领域 Score
        let parsed = ArtiMuseResponse::from_raw(&result)?;
        parsed.to_domain_score()
    }
}

/// 防腐层（ACL）：ArtiMuse 外部响应结构 → 领域 Score
///
/// ArtiMuse 返回 0-100 原始分数，通过 ACL 归一化到 0-5 分制。
/// 隔离外部 API schema 变动对领域层的影响。
struct ArtiMuseResponse {
    raw_score: f32,
    review: String,
}

impl ArtiMuseResponse {
    /// 从 ArtiMuse API 原始 JSON 中提取评分和点评
    fn from_raw(value: &serde_json::Value) -> Result<Self, DomainError> {
        let raw_score = value["score"].as_f64().unwrap_or(60.0) as f32;
        let review = value["review"]
            .as_str()
            .unwrap_or("No review available")
            .to_string();

        Ok(Self { raw_score, review })
    }

    /// 转换为领域 Score 值对象（包含 0-100 → 0-5 归一化）
    fn to_domain_score(self) -> Result<Score, DomainError> {
        Score::from_raw(self.raw_score, self.review)
    }
}
