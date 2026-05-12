use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    body::Bytes,
};
use std::sync::Arc;

use crate::presentation::error::ApiError;
use crate::AppState;

/// Stripe Webhook handler
/// 接收 checkout.session.completed 事件，记录捐赠并解锁用户限制
pub async fn stripe_webhook(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<impl IntoResponse, ApiError> {
    let sig_header = headers
        .get("stripe-signature")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let webhook_secret = std::env::var("STRIPE_WEBHOOK_SECRET")
        .map_err(|_| ApiError::External("STRIPE_WEBHOOK_SECRET not set".into()))?;

    // Stripe 签名验证：解析 timestamp 和 signatures
    let is_valid = verify_stripe_signature(&body, sig_header, &webhook_secret);
    if !is_valid {
        tracing::warn!("Stripe webhook signature verification failed");
        return Ok((StatusCode::BAD_REQUEST, "Invalid signature"));
    }

    let event: serde_json::Value = serde_json::from_slice(&body)
        .map_err(|e| ApiError::External(format!("Invalid JSON: {}", e)))?;

    let event_type = event["type"].as_str().unwrap_or("");
    tracing::info!("Stripe webhook received: {}", event_type);

    if event_type == "checkout.session.completed" {
        let session = &event["data"]["object"];
        let session_id = session["id"].as_str().unwrap_or("");
        let user_id = session["client_reference_id"]
            .as_str()
            .unwrap_or("")
            .to_string();
        let amount = session["amount_total"].as_i64().unwrap_or(0);
        let currency = session["currency"].as_str().unwrap_or("gbp").to_string();
        let status = session["payment_status"].as_str().unwrap_or("");

        if status == "paid" && !user_id.is_empty() {
            tracing::info!(
                "Recording donation: user_id={}, amount={} {}, session_id={}",
                user_id, amount, currency, session_id
            );
            state.repository.record_donation(&user_id, session_id, amount, &currency).await?;
            tracing::info!("Donation recorded successfully for user {}", user_id);
        } else {
            tracing::warn!(
                "Skipping donation record: status={}, user_id_empty={}",
                status,
                user_id.is_empty()
            );
        }
    }

    Ok((StatusCode::OK, "OK"))
}

/// 简化的 Stripe 签名验证
/// Stripe-Signature: t=<timestamp>,v1=<signature>,v0=<signature>
fn verify_stripe_signature(body: &Bytes, sig_header: &str, secret: &str) -> bool {
    let parts: Vec<&str> = sig_header.split(',').collect();
    let mut timestamp = "";
    let mut signatures = vec![];

    for part in parts {
        if part.starts_with("t=") {
            timestamp = &part[2..];
        } else if part.starts_with("v1=") {
            signatures.push(&part[3..]);
        }
    }

    if timestamp.is_empty() || signatures.is_empty() {
        return false;
    }

    let signed_payload = format!("{}.{}", timestamp, String::from_utf8_lossy(body));

    use hmac::{Hmac, Mac};
    use sha2::Sha256;

    type HmacSha256 = Hmac<Sha256>;

    let mut mac = match HmacSha256::new_from_slice(secret.as_bytes()) {
        Ok(m) => m,
        Err(_) => return false,
    };
    mac.update(signed_payload.as_bytes());
    let expected_sig = hex::encode(mac.finalize().into_bytes());

    signatures.iter().any(|&s| s == expected_sig)
}
