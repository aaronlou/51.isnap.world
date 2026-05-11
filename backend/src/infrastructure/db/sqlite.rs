use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use std::sync::{Arc, Mutex};
use tracing::info;

use crate::domain::{
    errors::DomainError,
    photo::{Photo, PhotoId},
    repository::PhotoRepository,
    score::Score,
};

#[derive(Clone)]
pub struct SqlitePhotoRepository {
    conn: Arc<Mutex<Connection>>,
}

impl SqlitePhotoRepository {
    pub fn new(db_path: &str) -> Result<Self, DomainError> {
        let conn = Connection::open(db_path)
            .map_err(|e| DomainError::StorageError(format!("Failed to open DB: {}", e)))?;
        let repo = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        repo.init()?;
        info!("Database initialized at {}", db_path);
        Ok(repo)
    }

    fn init(&self) -> Result<(), DomainError> {
        self.with_conn(|conn| {
            // 用户表：匿名用户及未来 OAuth 用户的统一存储
            conn.execute(
                "CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    last_seen_at TEXT NOT NULL,
                    nickname TEXT
                )",
                [],
            )?;

            conn.execute(
                "CREATE TABLE IF NOT EXISTS photos (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    score REAL,
                    review TEXT,
                    uploaded_at TEXT NOT NULL,
                    engine TEXT,
                    is_battle INTEGER DEFAULT 0,
                    user_id TEXT
                )",
                [],
            )?;
            // 兼容旧数据库：尝试添加 is_battle 列（已存在则忽略错误）
            let _ = conn.execute(
                "ALTER TABLE photos ADD COLUMN is_battle INTEGER DEFAULT 0",
                [],
            );
            // 兼容旧数据库：尝试添加 user_id 列
            let _ = conn.execute(
                "ALTER TABLE photos ADD COLUMN user_id TEXT",
                [],
            );
            Ok(())
        })
    }

    fn with_conn<T, F>(&self, f: F) -> Result<T, DomainError>
    where
        F: FnOnce(&Connection) -> Result<T, rusqlite::Error>,
    {
        let conn = self.conn.lock().map_err(|_| {
            DomainError::StorageError("Database lock poisoned".to_string())
        })?;
        f(&conn).map_err(|e| DomainError::StorageError(e.to_string()))
    }

    /// 确保用户记录存在（创建或更新 last_seen_at），首次创建时分配随机昵称
    pub async fn ensure_user(&self, user_id: &str) -> Result<(), DomainError> {
        self.with_conn(|conn| {
            let now = Utc::now().to_rfc3339();
            let nickname = generate_random_nickname();
            conn.execute(
                "INSERT INTO users (id, created_at, last_seen_at, nickname)
                 VALUES (?1, ?2, ?2, ?3)
                 ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at",
                params![user_id, now, nickname],
            )?;
            Ok(())
        })
    }

    pub async fn get_user(&self, user_id: &str) -> Result<Option<UserRecord>, DomainError> {
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, created_at, last_seen_at, nickname FROM users WHERE id = ?1"
            )?;
            let mut rows = stmt.query([user_id])?;
            if let Some(row) = rows.next()? {
                Ok(Some(UserRecord {
                    id: row.get(0)?,
                    created_at: row.get(1)?,
                    last_seen_at: row.get(2)?,
                    nickname: row.get(3)?,
                }))
            } else {
                Ok(None)
            }
        })
    }

    pub async fn update_nickname(&self, user_id: &str, nickname: &str) -> Result<(), DomainError> {
        self.with_conn(|conn| {
            conn.execute(
                "UPDATE users SET nickname = ?1 WHERE id = ?2",
                params![nickname, user_id],
            )?;
            Ok(())
        })
    }
}

#[async_trait::async_trait]
impl PhotoRepository for SqlitePhotoRepository {
    async fn save(&self, photo: &Photo) -> Result<(), DomainError> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO photos (id, filename, score, review, uploaded_at, engine, is_battle, user_id)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                 ON CONFLICT(id) DO UPDATE SET
                    score = excluded.score,
                    review = excluded.review,
                    engine = excluded.engine,
                    is_battle = excluded.is_battle,
                    user_id = excluded.user_id",
                params![
                    photo.id.as_str(),
                    photo.filename,
                    photo.score_value(),
                    photo.review,
                    photo.uploaded_at.to_rfc3339(),
                    photo.engine,
                    photo.is_battle as i32,
                    photo.user_id.as_ref(),
                ],
            )?;
            Ok(())
        })
    }

    async fn find_by_id(&self, id: &PhotoId) -> Result<Option<Photo>, DomainError> {
        tracing::debug!("Looking up photo by id: {:?}", id.as_str());
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, filename, score, review, uploaded_at, engine, is_battle, user_id FROM photos WHERE id = ?1"
            )?;
            let mut rows = stmt.query([id.as_str()])?;
            if let Some(row) = rows.next()? {
                tracing::info!("Found photo: {:?}", id.as_str());
                Ok(Some(row_to_photo(row)?))
            } else {
                tracing::warn!("Photo not found in DB: {:?}", id.as_str());
                // 列出当前所有照片 ID
                if let Ok(mut all_ids) = conn.prepare("SELECT id FROM photos") {
                    if let Ok(ids) = all_ids.query_map([], |r| r.get::<_, String>(0)) {
                        let ids: Vec<String> = ids.filter_map(|r| r.ok()).collect();
                        tracing::warn!("Existing photo IDs in DB: {:?}", ids);
                    }
                }
                Ok(None)
            }
        })
    }

    async fn list_all(&self) -> Result<Vec<Photo>, DomainError> {
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, filename, score, review, uploaded_at, engine, is_battle, user_id FROM photos ORDER BY uploaded_at DESC"
            )?;
            let rows = stmt.query_map([], row_to_photo)?;
            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))
        })
    }

    async fn list_top_scored(&self, limit: usize) -> Result<Vec<Photo>, DomainError> {
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, filename, score, review, uploaded_at, engine, is_battle, user_id FROM photos
                 WHERE score IS NOT NULL AND is_battle = 0 ORDER BY score DESC LIMIT ?1"
            )?;
            let rows = stmt.query_map([limit], row_to_photo)?;
            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))
        })
    }

    async fn delete(&self, id: &PhotoId) -> Result<(), DomainError> {
        self.with_conn(|conn| {
            conn.execute("DELETE FROM photos WHERE id = ?1", [id.as_str()])?;
            Ok(())
        })
    }
}

impl SqlitePhotoRepository {
    /// 查询某用户所有已评分的照片（用于个人纵向统计）
    pub async fn list_scored_by_user(&self, user_id: &str) -> Result<Vec<Photo>, DomainError> {
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, filename, score, review, uploaded_at, engine, is_battle, user_id
                 FROM photos WHERE user_id = ?1 AND score IS NOT NULL ORDER BY score DESC"
            )?;
            let rows = stmt.query_map([user_id], row_to_photo)?;
            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))
        })
    }
}

/// 统一的行映射函数（消除字段映射的重复和索引错误风险）
fn row_to_photo(row: &rusqlite::Row) -> Result<Photo, rusqlite::Error> {
    let uploaded_at_str: String = row.get(4)?;
    let uploaded_at = DateTime::parse_from_rfc3339(&uploaded_at_str)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now());

    let score_value: Option<f32> = row.get(2)?;
    let review: Option<String> = row.get(3)?;
    let score = match (score_value, review.clone()) {
        (Some(v), Some(r)) => Score::new(v, r).ok(),
        _ => None,
    };
    let is_battle: i32 = row.get(6).unwrap_or(0);
    let user_id: Option<String> = row.get(7).ok();

    Ok(Photo {
        id: PhotoId::new(row.get(0)?),
        filename: row.get(1)?,
        score,
        review,
        uploaded_at,
        engine: row.get(5)?,
        is_battle: is_battle != 0,
        user_id,
    })
}

/// 用户记录（用于返回给表现层）
#[derive(Debug, Clone)]
pub struct UserRecord {
    pub id: String,
    pub created_at: String,
    pub last_seen_at: String,
    pub nickname: Option<String>,
}

/// 生成随机趣味昵称
fn generate_random_nickname() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let adjectives = [
        "好奇的", "执着的", "浪漫的", "孤独的", "疯狂的",
        "安静的", "自由的", "迷茫的", "敏锐的", "慵懒的",
        "炽热的", "冷静的", "倔强的", "温柔的", "狂野的",
    ];
    let nouns = [
        "摄影师", "追光者", "快门手", "取景框", "暗房师",
        "光影师", "构图家", "镜头客", "胶片人", "曝光师",
        "逐影人", "拾光者", "映像师", "焦距控", "感光体",
    ];

    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos() as usize;
    let adj = adjectives[seed % adjectives.len()];
    let noun = nouns[(seed / adjectives.len()) % nouns.len()];
    let num = (seed % 9000) + 1000;
    format!("{}{}#{}", adj, noun, num)
}
