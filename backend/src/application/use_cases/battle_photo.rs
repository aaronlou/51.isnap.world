use base64::{engine::general_purpose::STANDARD, Engine};

use crate::application::dto::{BattleResultDto, PhotoDto};
use crate::domain::{
    errors::DomainError,
    photo::PhotoId,
    repository::PhotoRepository,
};
use crate::infrastructure::http::unsplash_client::UnsplashClient;

const GEMINI_API_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

const BATTLE_PROMPT: &str = r#"你是一位资深摄影大赛评委，拥有 20 年国际摄影展评审经验。

现在有两张照片摆在你面前，请你进行专业、公正、深入的对比评审：
- 照片 A：一位摄影爱好者的投稿作品
- 照片 B：来自 Unsplash 平台的专业摄影师作品（摄影师：__PHOTOGRAPHER__，作品名：__TITLE__）

请从以下五个维度分别给出评分（0.0-5.0，允许一位小数）：
1. 构图（画面布局、视觉引导、平衡感）
2. 光影（曝光控制、明暗层次、氛围营造）
3. 色彩（色调搭配、饱和度控制、色彩情绪）
4. 主题表达（故事性、情感传递、创意独特性）
5. 技术执行（对焦、清晰度、动态范围、噪点控制）

评分标准：
- 4.5-5.0：极少数的杰作，具有强烈的视觉冲击力和艺术独创性
- 3.8-4.4：优秀作品，技术成熟，有明显的艺术表达
- 3.0-3.7：合格作品，有基本美感，但有改进空间
- 2.0-2.9：有明显短板，需要正视问题
- 1.0-1.9：问题较多，需要系统学习基础
- 0.0-0.9：存在致命错误

请严格按照以下 JSON 格式回复，不要添加任何额外文字：
{
  "photo_a_score": X.X,
  "photo_a_review": "对照片A的点评（80-120字中文，指出具体优缺点）",
  "photo_b_score": X.X,
  "photo_b_review": "对照片B的点评（80-120字中文，指出具体优缺点）",
  "winner": "A" or "B" or "draw",
  "comparison": "综合对比分析（150-200字中文）。重点分析：照片A相比专业作品的差距在哪里、优势在哪里、最具体的三条提升建议是什么。语气要鼓励但不敷衍。"
}

重要要求：
1. 分数必须反映真实质量差异，不要给"安全分"
2. 不同照片应该有明显不同的分数
3. 即使照片A输给专业作品，也要真诚指出它的亮点
4. 点评必须与分数一致"#;

pub struct BattlePhotoUseCase<R: PhotoRepository> {
    repository: R,
    upload_dir: std::path::PathBuf,
    unsplash: UnsplashClient,
    gemini_api_key: String,
    base_url: String,
}

impl<R: PhotoRepository> BattlePhotoUseCase<R> {
    pub fn new(
        repository: R,
        upload_dir: std::path::PathBuf,
        unsplash: UnsplashClient,
        gemini_api_key: String,
        base_url: String,
    ) -> Self {
        Self {
            repository,
            upload_dir,
            unsplash,
            gemini_api_key,
            base_url,
        }
    }

    pub async fn execute(&self, photo_id: &str) -> Result<BattleResultDto, DomainError> {
        let id = PhotoId::new(photo_id.to_string());

        // 1. 查找用户照片
        let photo = self
            .repository
            .find_by_id(&id)
            .await?
            .ok_or_else(|| DomainError::PhotoNotFound(photo_id.to_string()))?;

        // 2. 从 Unsplash 获取随机对手照片
        let opponent = self.unsplash.fetch_random().await?;
        tracing::info!(
            "Unsplash opponent: {} by {} | {}",
            opponent.title,
            opponent.photographer,
            opponent.photographer_link
        );

        // 3. 读取用户照片文件
        let user_image_path = photo.storage_path(&self.upload_dir);
        let user_image_data =
            std::fs::read(&user_image_path).map_err(|e| DomainError::StorageError(e.to_string()))?;
        let user_base64 = STANDARD.encode(&user_image_data);

        // 4. 下载对手照片（使用 regular 尺寸，1080px 宽，足够 AI 分析且传输更快）
        let opponent_bytes = self.unsplash.download_photo(&opponent.display_url).await?;
        let opponent_base64 = STANDARD.encode(&opponent_bytes);

        // 5. 调用 Gemini 进行对比评审
        let prompt = BATTLE_PROMPT
            .replace("__PHOTOGRAPHER__", &opponent.photographer)
            .replace("__TITLE__", &opponent.title);

        let request_body = serde_json::json!({
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": user_base64
                        }
                    },
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": opponent_base64
                        }
                    }
                ]
            }]
        });

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .build()
            .map_err(|e| DomainError::EngineUnavailable(format!("HTTP client build failed: {}", e)))?;

        let response = client
            .post(format!("{}?key={}", GEMINI_API_URL, self.gemini_api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Gemini battle request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(DomainError::EngineUnavailable(format!(
                "Gemini battle returned {}: {}",
                status, text
            )));
        }

        let gemini_resp: serde_json::Value = response
            .json()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Parse error: {}", e)))?;

        let result = parse_battle_response(&gemini_resp)?;

        // 6. 构建 DTO
        let user_photo_dto = PhotoDto::from_photo(&photo, &self.base_url);

        Ok(BattleResultDto {
            user_photo_id: photo_id.to_string(),
            user_photo: user_photo_dto,
            user_score: result.user_score,
            user_review: result.user_review,
            opponent_photo_url: opponent.display_url,
            opponent_photo_title: opponent.title,
            opponent_photographer: opponent.photographer,
            opponent_photo_html_link: opponent.photographer_link,
            opponent_score: result.opponent_score,
            opponent_review: result.opponent_review,
            winner: result.winner,
            comparison: result.comparison,
            engine: "gemini".to_string(),
        })
    }
}

#[derive(Debug)]
struct ParsedBattleResult {
    user_score: f32,
    user_review: String,
    opponent_score: f32,
    opponent_review: String,
    winner: String,
    comparison: String,
}

fn parse_battle_response(value: &serde_json::Value) -> Result<ParsedBattleResult, DomainError> {
    let text = value["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("{}");

    let json_text = crate::infrastructure::http::gemini_client::extract_json_from_markdown(text);

    let parsed: serde_json::Value = serde_json::from_str(&json_text).map_err(|e| {
        DomainError::EngineUnavailable(format!("JSON parse error: {} | text: {}", e, text))
    })?;

    let user_score = parsed["photo_a_score"].as_f64().unwrap_or(3.0) as f32;
    let user_review = parsed["photo_a_review"]
        .as_str()
        .unwrap_or("评审暂不可用")
        .to_string();
    let opponent_score = parsed["photo_b_score"].as_f64().unwrap_or(3.5) as f32;
    let opponent_review = parsed["photo_b_review"]
        .as_str()
        .unwrap_or("评审暂不可用")
        .to_string();
    let winner = parsed["winner"]
        .as_str()
        .unwrap_or("draw")
        .to_string();
    let comparison = parsed["comparison"]
        .as_str()
        .unwrap_or("暂无对比分析")
        .to_string();

    Ok(ParsedBattleResult {
        user_score: user_score.clamp(0.0, 5.0),
        user_review,
        opponent_score: opponent_score.clamp(0.0, 5.0),
        opponent_review,
        winner,
        comparison,
    })
}
