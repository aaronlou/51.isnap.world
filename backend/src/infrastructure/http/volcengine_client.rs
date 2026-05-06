use std::path::Path;

use crate::domain::{errors::DomainError, score::Score, scoring::ScoringEngine};

pub struct VolcEngineClient {
    api_url: String,
}

impl VolcEngineClient {
    pub fn new(api_url: String) -> Self {
        Self { api_url }
    }
}

#[async_trait::async_trait]
impl ScoringEngine for VolcEngineClient {
    fn name(&self) -> &'static str {
        "volcengine"
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
            .map_err(|e| DomainError::EngineUnavailable(format!("VolcEngine request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(DomainError::EngineUnavailable(format!(
                "VolcEngine returned {}: {}",
                status, text
            )));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Parse error: {}", e)))?;

        // 防腐层（ACL）：将 VolcEngine 外部响应转为领域 Score
        let parsed = VolcEngineResponse::from_raw(&result)?;
        parsed.to_domain_score()
    }
}

/// 防腐层（ACL）：VolcEngine 外部响应结构 → 领域 Score
///
/// VolcEngine 美学评分模型基于 LAION-Aesthetics V2（CLIP-ViT-L/14 + MLP），
/// 输出 0.0-1.0 范围的标准化美学分数，通过 ACL 映射到 0-5 分制。
/// 评分原理：视觉特征提取 → 美学建模 → 多维度评估（色彩/构图/对比度）
struct VolcEngineResponse {
    raw_score: f32,
    review: String,
}

impl VolcEngineResponse {
    /// 从 VolcEngine API 原始 JSON 中提取评分
    fn from_raw(value: &serde_json::Value) -> Result<Self, DomainError> {
        // 优先读取 aesthetic_score，兼容 score 字段
        let raw_score = value["aesthetic_score"]
            .as_f64()
            .or_else(|| value["score"].as_f64())
            .unwrap_or(0.5) as f32;

        // 若服务端已返回 review 则直接使用，否则根据分数自动生成
        let review = value["review"]
            .as_str()
            .map(|s| s.to_string())
            .unwrap_or_else(|| Self::generate_review(raw_score));

        Ok(Self { raw_score, review })
    }

    /// 转换为领域 Score 值对象（0-1 → 0-5 归一化）
    fn to_domain_score(self) -> Result<Score, DomainError> {
        // VolcEngine 输出 0.0-1.0，映射到 0.0-5.0
        let normalized = self.raw_score * 5.0;
        Score::new(normalized, self.review)
    }

    /// 根据美学分数自动生成点评文案
    fn generate_review(score: f32) -> String {
        match score {
            s if s >= 0.85 => "构图精妙，色彩和谐，具有专业级视觉冲击力。".to_string(),
            s if s >= 0.70 => "整体观感良好，构图与光影处理较为出色。".to_string(),
            s if s >= 0.55 => "具有一定美感，但在构图或色彩上仍有提升空间。".to_string(),
            s if s >= 0.40 => "表现平平，建议关注主体突出与画面平衡。".to_string(),
            s if s >= 0.25 => "视觉吸引力有限，可从构图和光线入手改进。".to_string(),
            _ => "画面表现较弱，建议学习基础构图与色彩理论。".to_string(),
        }
    }
}
