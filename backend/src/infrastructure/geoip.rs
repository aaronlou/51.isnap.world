use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::Mutex;
use std::time::{Duration, Instant};

struct IpCache {
    map: HashMap<String, CacheEntry>,
}

struct CacheEntry {
    country: Option<String>,
    expires_at: Instant,
}

impl IpCache {
    fn new() -> Self {
        Self {
            map: HashMap::new(),
        }
    }

    fn get(&self, ip: &str) -> Option<Option<String>> {
        self.map.get(ip).and_then(|entry| {
            if Instant::now() < entry.expires_at {
                Some(entry.country.clone())
            } else {
                None
            }
        })
    }

    fn insert(&mut self, ip: String, country: Option<String>) {
        self.map.insert(
            ip,
            CacheEntry {
                country,
                expires_at: Instant::now() + Duration::from_secs(300),
            },
        );
    }
}

static CACHE: std::sync::LazyLock<Mutex<IpCache>> =
    std::sync::LazyLock::new(|| Mutex::new(IpCache::new()));

/// Look up the ISO 3166-1 alpha-2 country code for an IP address.
/// Uses ip-api.com (free, no API key required, limited to ~45 req/min).
/// Results are cached in memory for 5 minutes.
pub async fn lookup_country(ip: &str) -> Option<String> {
    // Check cache first
    {
        let cache = CACHE.lock().unwrap();
        if let Some(cached) = cache.get(ip) {
            return cached;
        }
    }

    // Skip private / loopback IPs
    if let Ok(addr) = ip.parse::<IpAddr>() {
        match addr {
            IpAddr::V4(v4) => {
                if v4.is_loopback() || v4.is_private() {
                    return None;
                }
            }
            IpAddr::V6(v6) => {
                if v6.is_loopback() {
                    return None;
                }
            }
        }
    }

    let url = format!("http://ip-api.com/json/{}?fields=countryCode", ip);
    match reqwest::Client::new()
        .get(&url)
        .timeout(Duration::from_secs(3))
        .send()
        .await
    {
        Ok(resp) => {
            let body: serde_json::Value = match resp.json().await {
                Ok(v) => v,
                Err(_) => {
                    let mut cache = CACHE.lock().unwrap();
                    cache.insert(ip.to_string(), None);
                    return None;
                }
            };
            let country = body["countryCode"].as_str().map(|s| s.to_string());
            let mut cache = CACHE.lock().unwrap();
            cache.insert(ip.to_string(), country.clone());
            country
        }
        Err(_) => {
            let mut cache = CACHE.lock().unwrap();
            cache.insert(ip.to_string(), None);
            None
        }
    }
}
