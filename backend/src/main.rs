use std::{fs, path::PathBuf, sync::Arc};

use axum::{
    extract::DefaultBodyLimit,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
    trace::TraceLayer,
};
use tracing::{info, warn};
use tracing_appender::rolling;
use tracing_subscriber::{
    filter::LevelFilter, layer::SubscriberExt, util::SubscriberInitExt, Layer as TracingLayer,
};

mod application;
mod domain;
mod infrastructure;
mod presentation;

use application::use_cases::{
    battle_photo::BattlePhotoUseCase, delete_photo::DeletePhotoUseCase,
    get_leaderboard::GetLeaderboardUseCase, get_random_unsplash::GetRandomUnsplashUseCase,
    list_photos::ListPhotosUseCase, score_photo::ScorePhotoUseCase,
    upload_photo::UploadPhotoUseCase,
};
use domain::scoring::ScoringCoordinator;
use infrastructure::{
    db::sqlite::SqlitePhotoRepository,
    http::{
        artimuse_client::ArtiMuseClient, gemini_client::GeminiClient,
        gemini_reviewer::GeminiReviewer, unsplash_client::UnsplashClient,
        volcengine_client::VolcEngineClient,
    },
    storage::local_file_storage::LocalFileStorage,
};
use presentation::routes::{battle, donate, health, leaderboard, photos, unsplash};

/// 全局应用状态（依赖注入容器）
pub struct AppState {
    pub upload_photo: UploadPhotoUseCase<SqlitePhotoRepository, LocalFileStorage>,
    pub score_photo: ScorePhotoUseCase<SqlitePhotoRepository>,
    pub list_photos: ListPhotosUseCase<SqlitePhotoRepository>,
    pub get_leaderboard: GetLeaderboardUseCase<SqlitePhotoRepository>,
    pub delete_photo: DeletePhotoUseCase<SqlitePhotoRepository, LocalFileStorage>,
    pub battle_photo: BattlePhotoUseCase<SqlitePhotoRepository>,
    pub random_unsplash: GetRandomUnsplashUseCase,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    // 初始化日志：stdout + 滚动文件
    let log_dir = std::env::var("LOG_DIR").unwrap_or_else(|_| "./logs".to_string());
    fs::create_dir_all(&log_dir).ok();

    // 标准输出（带颜色，供 docker logs / 终端查看）
    let stdout_layer = tracing_subscriber::fmt::layer()
        .with_target(true)
        .with_thread_ids(false);

    // 全部日志 -> logs/app.log（每日滚动，保留 7 天）
    let file_appender = rolling::daily(&log_dir, "app.log");
    let (file_writer, _file_guard) = tracing_appender::non_blocking(file_appender);
    let file_layer = tracing_subscriber::fmt::layer()
        .with_writer(file_writer)
        .with_target(true)
        .with_ansi(false)
        .with_filter(LevelFilter::DEBUG);

    // ERROR 级别日志 -> logs/error.log
    let error_appender = rolling::daily(&log_dir, "error.log");
    let (error_writer, _error_guard) = tracing_appender::non_blocking(error_appender);
    let error_layer = tracing_subscriber::fmt::layer()
        .with_writer(error_writer)
        .with_target(true)
        .with_ansi(false)
        .with_filter(LevelFilter::ERROR);

    tracing_subscriber::registry()
        .with(stdout_layer)
        .with(file_layer)
        .with(error_layer)
        .init();

    // 配置
    let upload_dir =
        PathBuf::from(std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string()));
    fs::create_dir_all(&upload_dir).expect("Failed to create uploads directory");

    let db_path = std::env::var("DATABASE_PATH").unwrap_or_else(|_| "photos.db".to_string());

    let base_url =
        std::env::var("BASE_URL").unwrap_or_else(|_| "http://localhost:3001".to_string());

    let gemini_api_key = std::env::var("GEMINI_API_KEY").unwrap_or_else(|_| {
        warn!("GEMINI_API_KEY not set");
        String::new()
    });

    let artimuse_enabled = std::env::var("ARTIMUSE_ENABLED")
        .map(|v| v.eq_ignore_ascii_case("true"))
        .unwrap_or(false);

    let artimuse_url =
        std::env::var("ARTIMUSE_URL").unwrap_or_else(|_| "http://127.0.0.1:8000".to_string());

    let volcengine_enabled = std::env::var("VOLCENGINE_ENABLED")
        .map(|v| v.eq_ignore_ascii_case("true"))
        .unwrap_or(false);

    let volcengine_url =
        std::env::var("VOLCENGINE_URL").unwrap_or_else(|_| "http://127.0.0.1:8001".to_string());

    let unsplash_client_id = std::env::var("UNSPLASH_CLIENT_ID").unwrap_or_else(|_| {
        warn!("UNSPLASH_CLIENT_ID not set; battle mode will be unavailable");
        String::new()
    });

    // 基础设施层
    let repository = SqlitePhotoRepository::new(&db_path).expect("Failed to initialize database");

    // 评分协调器（领域服务）
    // 注册顺序决定优先级：先注册的先尝试，成功后直接返回
    // 当前优先级：Gemini > VolcEngine > ArtiMuse > simulated
    let mut coordinator = ScoringCoordinator::new();

    if !gemini_api_key.is_empty() {
        info!("Gemini scoring enabled");
        coordinator.register(Box::new(GeminiClient::new(gemini_api_key.clone())));
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
        file_storage.clone(),
        upload_dir.clone(),
        base_url.clone(),
    );
    let mut score_photo = ScorePhotoUseCase::new(repository.clone(), upload_dir.clone(), coordinator);
    if !gemini_api_key.is_empty() {
        info!("Gemini review generation enabled");
        score_photo = score_photo.with_reviewer(Box::new(GeminiReviewer::new(gemini_api_key.clone())));
    }
    let list_photos = ListPhotosUseCase::new(repository.clone(), base_url.clone());
    let get_leaderboard = GetLeaderboardUseCase::new(repository.clone(), base_url.clone());
    let delete_photo = DeletePhotoUseCase::new(
        repository.clone(),
        file_storage,
        upload_dir.clone(),
        base_url.clone(),
    );

    let unsplash_client = UnsplashClient::new(unsplash_client_id);

    let battle_photo = BattlePhotoUseCase::new(
        repository,
        upload_dir.clone(),
        unsplash_client.clone(),
        gemini_api_key,
        base_url,
    );

    let random_unsplash = GetRandomUnsplashUseCase::new(unsplash_client);

    let state = Arc::new(AppState {
        upload_photo,
        score_photo,
        list_photos,
        get_leaderboard,
        delete_photo,
        battle_photo,
        random_unsplash,
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
        .route("/api/photos/:id", axum::routing::delete(photos::delete_photo))
        .route("/api/photos/:id/battle", post(battle::battle_photo))
        .route("/api/unsplash/random", get(unsplash::random_unsplash_photo))
        .route("/api/health", get(health::health_check))
        .route("/api/donate", post(donate::create_checkout_session))
        .nest_service("/uploads", ServeDir::new("./uploads"))
        .nest_service("/thumbnails", ServeDir::new("./uploads/thumbnails"))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .layer(DefaultBodyLimit::max(50 * 1024 * 1024))
        .with_state(state)
        .fallback(|req: axum::http::Request<axum::body::Body>| async move {
            tracing::warn!("FALLBACK: {} {} matched no route", req.method(), req.uri());
            (StatusCode::NOT_FOUND, "no matching route").into_response()
        });

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .expect("Failed to bind to port 3001");

    info!("🚀 Shutter Quest backend running on http://0.0.0.0:3001");
    axum::serve(listener, app).await.unwrap();
}
