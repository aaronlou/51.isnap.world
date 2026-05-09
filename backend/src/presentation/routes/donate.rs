use axum::{
    extract::State,
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

#[derive(Debug, Serialize)]
struct StripeCheckoutSessionRequest {
    line_items: Vec<StripeLineItem>,
    mode: String,
    success_url: String,
    cancel_url: String,
    payment_method_types: Vec<String>,
}

#[derive(Debug, Serialize)]
struct StripeLineItem {
    price_data: StripePriceData,
    quantity: i32,
}

#[derive(Debug, Serialize)]
struct StripePriceData {
    currency: String,
    unit_amount: i64,
    product_data: StripeProductData,
}

#[derive(Debug, Serialize)]
struct StripeProductData {
    name: String,
    description: String,
}

#[derive(Debug, Deserialize)]
struct StripeCheckoutSessionResponse {
    url: String,
}

pub async fn create_checkout_session(
    _state: State<Arc<AppState>>,
    Json(payload): Json<CreateDonationRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let secret_key = std::env::var("STRIPE_SECRET_KEY")
        .map_err(|_| ApiError::External("STRIPE_SECRET_KEY not set".into()))?;

    let frontend_url = std::env::var("FRONTEND_URL")
        .or_else(|_| std::env::var("BASE_URL"))
        .unwrap_or_else(|_| "http://localhost:3001".to_string());

    let currency = payload.currency.to_lowercase();
    let currency_label = if currency == "usd" { "$" } else { "£" };

    // Stripe 要求金额至少为 50 分
    let amount = payload.amount.max(50);

    let session_req = StripeCheckoutSessionRequest {
        line_items: vec![StripeLineItem {
            price_data: StripePriceData {
                currency: currency.clone(),
                unit_amount: amount,
                product_data: StripeProductData {
                    name: "支持摄影大乱斗".to_string(),
                    description: format!("感谢您的支持，这将帮助我们持续改进产品"),
                },
            },
            quantity: 1,
        }],
        mode: "payment".to_string(),
        success_url: format!("{}?donate=success", frontend_url),
        cancel_url: format!("{}?donate=cancel", frontend_url),
        // TODO: 等 Stripe Dashboard Alipay 审批通过后，加回 "alipay"
        payment_method_types: vec!["card".to_string()],
    };

    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.stripe.com/v1/checkout/sessions")
        .basic_auth(&secret_key, Some(""))
        .json(&session_req)
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
