use std::path::Path;

use super::{errors::DomainError, score::Score};

/// 评分引擎接口（领域层定义）
/// 统一所有评分引擎的接口，消除引擎调用中的重复
#[async_trait::async_trait]
pub trait ScoringEngine: Send + Sync {
    /// 引擎名称标识
    fn name(&self) -> &'static str;

    /// 对指定图片路径进行评分
    async fn score(&self, image_path: &Path) -> Result<Score, DomainError>;
}

/// 评分协调器（领域服务）
/// 管理多个评分引擎的优先级调度，消除路由中的 if-else 链
pub struct ScoringCoordinator {
    engines: Vec<Box<dyn ScoringEngine>>,
}

impl ScoringCoordinator {
    pub fn new() -> Self {
        Self { engines: Vec::new() }
    }

    pub fn register(&mut self, engine: Box<dyn ScoringEngine>) {
        self.engines.push(engine);
    }

    /// 按注册顺序优先级调度引擎评分
    pub async fn score(&self, image_path: &Path) -> Result<(Score, &'static str), DomainError> {
        for engine in &self.engines {
            match engine.score(image_path).await {
                Ok(score) => return Ok((score, engine.name())),
                Err(e) => {
                    tracing::warn!(
                        "Engine {} failed: {}, trying next...",
                        engine.name(),
                        e
                    );
                }
            }
        }

        // Fallback: 所有引擎都失败时返回模拟评分
        let fallback = Score::new(
            3.5,
            "AI 评审暂时离线，这是基础鼓励分！继续探索发现更多精彩 🎈".to_string(),
        )?;
        Ok((fallback, "simulated"))
    }

    /// 调用所有可用引擎评分并取平均（归一化到 5 分制后求平均）
    /// 返回平均分、合并后的引擎名列表
    pub async fn score_averaged(&self, image_path: &Path) -> Result<(Score, String), DomainError> {
        let mut values = Vec::new();
        let mut reviews = Vec::new();
        let mut names = Vec::new();

        for engine in &self.engines {
            match engine.score(image_path).await {
                Ok(score) => {
                    tracing::info!(
                        "Engine {} scored: {:.2}",
                        engine.name(),
                        score.value()
                    );
                    values.push(score.value());
                    reviews.push(score.review().to_string());
                    names.push(engine.name());
                }
                Err(e) => {
                    tracing::warn!("Engine {} failed: {}, skipping", engine.name(), e);
                }
            }
        }

        if values.is_empty() {
            let fallback = Score::new(
                3.5,
                "所有 AI 评审暂时离线，这是基础鼓励分！📸".to_string(),
            )?;
            return Ok((fallback, "simulated".to_string()));
        }

        // 所有分数归一化到 5 分制后求平均
        let avg = values.iter().sum::<f32>() / values.len() as f32;

        // 用第一个成功引擎的 review（通常是更详细的 AI 点评）
        let review = reviews.into_iter().next().unwrap_or_default();

        let engine_label = names.join(" + ");

        tracing::info!(
            "Averaged score: {:.2} from engines: {}, individual scores: {:?}",
            avg,
            engine_label,
            values
        );

        Ok((Score::new(avg, review)?, engine_label))
    }

    pub fn engine_count(&self) -> usize {
        self.engines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.engines.is_empty()
    }
}
