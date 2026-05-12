use std::path::Path;

use base64::{engine::general_purpose::STANDARD, Engine};

use crate::domain::errors::DomainError;
use crate::infrastructure::http::gemini_client::extract_json_from_markdown;

const GEMINI_API_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

const SYSTEM_PROMPT: &str = r#"你是一位资深摄影导师，拥有20年专业摄影教学经验。你的学生向你展示了一张照片并寻求指导。

对话规则：
1. 用中文回答，语气亲切、专业且富有启发性，像一位耐心的导师。
2. 回答要具体、可操作，不要泛泛而谈。例如不要说"构图不错"，而要说"主体放在左侧三分线上，视线引导很清晰"。
3. 如果学生问后期处理，给出具体的 Lightroom/Photoshop 调整建议。
4. 如果学生问拍摄技巧，给出具体的参数建议（光圈、快门、ISO）。
5. 每次回答控制在 150 字以内，保持精炼。
6. 你始终能看到学生上传的原始照片，所以你的建议必须基于这张照片的实际内容。

请直接回答学生的问题，不要加前缀。"#;

pub struct GeminiMentor {
    api_key: String,
}

impl GeminiMentor {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }

    /// 发送导师对话请求，包含图片和历史消息上下文
    pub async fn chat(
        &self,
        image_path: &Path,
        history: &[MentorMessage],
        user_message: &str,
    ) -> Result<String, DomainError> {
        let image_data =
            std::fs::read(image_path).map_err(|e| DomainError::StorageError(e.to_string()))?;
        let base64_image = STANDARD.encode(&image_data);

        // 构建 Gemini contents 数组
        let mut contents = vec![];

        // 系统提示作为第一条 user message 的 parts 前置
        // 实际上 Gemini 的 systemInstruction 字段是 v1beta 支持的，我们直接用 contents
        // 把系统提示放在第一条
        contents.push(serde_json::json!({
            "role": "user",
            "parts": [
                {"text": SYSTEM_PROMPT},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": base64_image
                    }
                }
            ]
        }));

        // 历史消息
        for msg in history {
            let role = if msg.role == "user" { "user" } else { "model" };
            contents.push(serde_json::json!({
                "role": role,
                "parts": [{"text": msg.content}]
            }));
        }

        // 当前用户消息
        contents.push(serde_json::json!({
            "role": "user",
            "parts": [{"text": user_message}]
        }));

        let request_body = serde_json::json!({
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 512
            }
        });

        let mut client_builder = reqwest::Client::builder().timeout(std::time::Duration::from_secs(30));

        if let Ok(proxy_url) =
            std::env::var("HTTPS_PROXY").or_else(|_| std::env::var("https_proxy"))
        {
            if let Ok(proxy) = reqwest::Proxy::https(&proxy_url) {
                client_builder = client_builder.proxy(proxy);
                tracing::info!("Using HTTPS proxy for Gemini Mentor API");
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
            .map_err(|e| DomainError::EngineUnavailable(format!("Gemini mentor request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(DomainError::EngineUnavailable(format!(
                "Gemini mentor returned {}: {}",
                status, text
            )));
        }

        let gemini_resp: serde_json::Value = response
            .json()
            .await
            .map_err(|e| DomainError::EngineUnavailable(format!("Parse error: {}", e)))?;

        let text = gemini_resp["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .unwrap_or("");

        // 尝试清理可能的 markdown json 包装
        let cleaned = extract_json_from_markdown(text);
        // 如果清理后不是纯JSON（即原始文本没有```json包裹），用原始文本
        let final_text = if cleaned.len() < text.len() / 2 {
            text.trim().to_string()
        } else {
            cleaned
        };

        // 尝试解析为 JSON 以提取 reply 字段（如果有的话）
        if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(&final_text) {
            if let Some(reply) = json_val["reply"].as_str() {
                return Ok(reply.trim().to_string());
            }
        }

        Ok(final_text.trim().to_string())
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MentorMessage {
    pub role: String,
    pub content: String,
}
