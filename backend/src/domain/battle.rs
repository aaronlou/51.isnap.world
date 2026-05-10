use serde::{Deserialize, Serialize};

/// 对决结果值对象
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BattleResult {
    pub user_score: f32,
    pub user_review: String,
    pub opponent_score: f32,
    pub opponent_review: String,
    /// "user" | "opponent" | "draw"
    pub winner: String,
    pub comparison: String,
}

impl BattleResult {
    pub fn new(
        user_score: f32,
        user_review: String,
        opponent_score: f32,
        opponent_review: String,
        winner: String,
        comparison: String,
    ) -> Self {
        Self {
            user_score,
            user_review,
            opponent_score,
            opponent_review,
            winner,
            comparison,
        }
    }
}
