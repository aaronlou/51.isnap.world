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
            "AI 伙伴暂时离线，先给你一个鼓励分！下次再来探索更多发现 🎈".to_string(),
        )?;
        Ok((fallback, "simulated"))
    }

    pub fn engine_count(&self) -> usize {
        self.engines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.engines.is_empty()
    }
}
