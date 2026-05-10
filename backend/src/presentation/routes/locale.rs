use axum::{http::HeaderMap, response::IntoResponse, Json};

use crate::infrastructure::geoip::lookup_country;

pub async fn detect_locale(headers: HeaderMap) -> impl IntoResponse {
    let locale = detect(&headers).await;
    Json(serde_json::json!({ "locale": locale }))
}

async fn detect(headers: &HeaderMap) -> &'static str {
    let ip = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next().map(|s| s.trim()))
        .or_else(|| headers.get("x-real-ip").and_then(|v| v.to_str().ok()));

    if let Some(ip) = ip {
        if let Some(country) = lookup_country(ip).await {
            return if country == "CN" { "zh" } else { "en" };
        }
    }

    // Fallback to Accept-Language header
    if let Some(accept_lang) = headers.get("accept-language") {
        if let Ok(val) = accept_lang.to_str() {
            if val.starts_with("zh") {
                return "zh";
            }
        }
    }

    "en"
}
