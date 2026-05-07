use std::{fs, path::PathBuf, sync::Arc};

use axum::{
    routing::{get, post},
    Router,
};
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
    trace::TraceLayer,
};
use tracing::{info, warn};

mod application;
mod domain;
mod infrastructure;
mod presentation;

use application::use_cases::{
    get_leaderboard::GetLeaderboardUseCase,
    list_photos::ListPhotosUseCase,
    score_photo::ScorePhotoUseCase,
    upload_photo::UploadPhotoUseCase,
};
use domain::scoring::ScoringCoordinator;
use infrastructure::{
    db::sqlite::SqlitePhotoRepository,
    http::{artimuse_client::ArtiMuseClient, gemini_client::GeminiClient, volcengine_client::VolcEngineClient},
    storage::local_file_storage::LocalFileStorage,
};
use presentation::routes::{health, leaderboard, photos};

/// 全局应用状态（依赖注入容器）
pub struct AppState {
    pub upload_photo: UploadPhotoUseCase<SqlitePhotoRepository, LocalFileStorage>,
    pub score_photo: ScorePhotoUseCase<SqlitePhotoRepository>,
    pub list_photos: ListPhotosUseCase<SqlitePhotoRepository>,
    pub get_leaderboard: GetLeaderboardUseCase<SqlitePhotoRepository>,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    // 配置
    let upload_dir = PathBuf::from(
        std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string()),
    );
    fs::create_dir_all(&upload_dir).expect("Failed to create uploads directory");

    let db_path = std::env::var("DATABASE_PATH").unwrap_or_else(|_| "photos.db".to_string());

    let base_url = std::env::var("BASE_URL")
        .unwrap_or_else(|_| "http://localhost:3001".to_string());

    let gemini_api_key = std::env::var("GEMINI_API_KEY").unwrap_or_else(|_| {
        warn!("GEMINI_API_KEY not set");
        String::new()
    });

    let artimuse_enabled = std::env::var("ARTIMUSE_ENABLED")
        .map(|v| v.eq_ignore_ascii_case("true"))
        .unwrap_or(false);

    let artimuse_url = std::env::var("ARTIMUSE_URL")
        .unwrap_or_else(|_| "http://127.0.0.1:8000".to_string());

    let volcengine_enabled = std::env::var("VOLCENGINE_ENABLED")
        .map(|v| v.eq_ignore_ascii_case("true"))
        .unwrap_or(false);

    let volcengine_url = std::env::var("VOLCENGINE_URL")
        .unwrap_or_else(|_| "http://127.0.0.1:8001".to_string());

    // 基础设施层
    let repository = SqlitePhotoRepository::new(&db_path)
        .expect("Failed to initialize database");

    // 评分协调器（领域服务）
    // 注册顺序决定优先级：先注册的先尝试，成功后直接返回
    // 当前优先级：Gemini > VolcEngine > ArtiMuse > simulated
    let mut coordinator = ScoringCoordinator::new();

    if !gemini_api_key.is_empty() {
        info!("Gemini scoring enabled");
        coordinator.register(Box::new(GeminiClient::new(gemini_api_key)));
    }

    if volcengine_enabled {
        info!("VolcEngine scoring enabled at {}", volcengine_url);
        coordinator.register(Box::new(VolcEngineClient::new(volcengine_url)));
    }

    if artimuse_enabled {
        info!("ArtiMuse scoring enabled at {}", artimuse_url);
        coordinator.register(Box::new(ArtiMuseClient::new(artimuse_url)));
    }

    if coordinator.is_empty() {
        warn!("No scoring engine configured; using simulated scores");
    }

    // 文件存储
    let file_storage = LocalFileStorage;

    // 应用层用例
    let upload_photo = UploadPhotoUseCase::new(
        repository.clone(),
        file_storage,
        upload_dir.clone(),
        base_url.clone(),
    );
    let score_photo = ScorePhotoUseCase::new(
        repository.clone(),
        upload_dir,
        coordinator,
    );
    let list_photos = ListPhotosUseCase::new(repository.clone(), base_url.clone());
    let get_leaderboard = GetLeaderboardUseCase::new(repository, base_url);

    let state = Arc::new(AppState {
        upload_photo,
        score_photo,
        list_photos,
        get_leaderboard,
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/photos", get(photos::list_photos))
        .route("/api/upload", post(photos::upload_photo))
        .route("/api/leaderboard", get(leaderboard::get_leaderboard))
        .route("/api/photos/:id/score", post(photos::score_photo))
        .route("/api/health", get(health::health_check))
        .nest_service("/uploads", ServeDir::new("./uploads"))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .expect("Failed to bind to port 3001");

    info!("🚀 Shutter Quest backend running on http://0.0.0.0:3001");
    axum::serve(listener, app).await.unwrap();
}
