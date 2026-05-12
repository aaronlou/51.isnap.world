use axum::{
    extract::State,
    http::HeaderMap,
    response::{IntoResponse, Json},
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::presentation::error::ApiError;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct CreateDonationRequest {
    /// 金额，单位：分
    amount: i64,
    /// 货币代码：gbp 或 usd，默认 gbp
    #[serde(default = "default_currency")]
    currency: String,
}

fn default_currency() -> String {
    "gbp".to_string()
}

#[derive(Debug, Serialize)]
pub struct CreateDonationResponse {
    url: String,
}

#[derive(Debug, Deserialize)]
struct StripeCheckoutSessionResponse {
    url: String,
}

pub async fn create_checkout_session(
    _state: State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<CreateDonationRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let secret_key = std::env::var("STRIPE_SECRET_KEY")
        .map_err(|_| ApiError::External("STRIPE_SECRET_KEY not set".into()))?;

    let frontend_url = std::env::var("FRONTEND_URL")
        .or_else(|_| std::env::var("BASE_URL"))
        .unwrap_or_else(|_| "http://localhost:3001".to_string());

    // 提取匿名用户 ID，用于关联捐赠记录
    let user_id = headers
        .get("X-User-ID")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .unwrap_or_default();

    // Stripe 要求金额至少为 50 分
    let amount = payload.amount.max(50);
    let currency = payload.currency.to_lowercase();

    // Stripe API 需要 form-encoded 格式
    let mut params: Vec<(String, String)> = vec![
        ("mode".to_string(), "payment".to_string()),
        ("success_url".to_string(), format!("{}?donate=success", frontend_url)),
        ("cancel_url".to_string(), format!("{}?donate=cancel", frontend_url)),
        ("payment_method_types[0]".to_string(), "card".to_string()),
        ("line_items[0][price_data][currency]".to_string(), currency),
        ("line_items[0][price_data][unit_amount]".to_string(), amount.to_string()),
        (
            "line_items[0][price_data][product_data][name]".to_string(),
            "支持摄影大乱斗".to_string(),
        ),
        (
            "line_items[0][price_data][product_data][description]".to_string(),
            "感谢您的支持，这将帮助我们持续改进产品".to_string(),
        ),
        ("line_items[0][quantity]".to_string(), "1".to_string()),
    ];

    // 将用户 ID 绑定到 Stripe Session，webhook 回调时用于识别捐赠者
    if !user_id.is_empty() {
        params.push(("client_reference_id".to_string(), user_id));
    }

    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.stripe.com/v1/checkout/sessions")
        .basic_auth(&secret_key, Some(""))
        .form(&params)
        .send()
        .await
        .map_err(|e| ApiError::External(format!("Stripe request failed: {}", e)))?;

    if !resp.status().is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(ApiError::External(format!("Stripe error: {}", text)));
    }

    let session: StripeCheckoutSessionResponse = resp
        .json()
        .await
        .map_err(|e| ApiError::External(format!("Failed to parse Stripe response: {}", e)))?;

    Ok(Json(CreateDonationResponse { url: session.url }))
}
