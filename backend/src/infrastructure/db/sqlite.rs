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
            conn.execute(
                "CREATE TABLE IF NOT EXISTS photos (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    score REAL,
                    review TEXT,
                    uploaded_at TEXT NOT NULL,
                    engine TEXT
                )",
                [],
            )?;
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
}

#[async_trait::async_trait]
impl PhotoRepository for SqlitePhotoRepository {
    async fn save(&self, photo: &Photo) -> Result<(), DomainError> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO photos (id, filename, score, review, uploaded_at, engine)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                 ON CONFLICT(id) DO UPDATE SET
                    score = excluded.score,
                    review = excluded.review,
                    engine = excluded.engine",
                params![
                    photo.id.as_str(),
                    photo.filename,
                    photo.score_value(),
                    photo.review,
                    photo.uploaded_at.to_rfc3339(),
                    photo.engine,
                ],
            )?;
            Ok(())
        })
    }

    async fn find_by_id(&self, id: &PhotoId) -> Result<Option<Photo>, DomainError> {
        tracing::debug!("Looking up photo by id: {:?}", id.as_str());
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, filename, score, review, uploaded_at, engine FROM photos WHERE id = ?1"
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
                "SELECT id, filename, score, review, uploaded_at, engine FROM photos ORDER BY uploaded_at DESC"
            )?;
            let rows = stmt.query_map([], row_to_photo)?;
            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))
        })
    }

    async fn list_top_scored(&self, limit: usize) -> Result<Vec<Photo>, DomainError> {
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, filename, score, review, uploaded_at, engine FROM photos
                 WHERE score IS NOT NULL ORDER BY score DESC LIMIT ?1"
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

    Ok(Photo {
        id: PhotoId::new(row.get(0)?),
        filename: row.get(1)?,
        score,
        review,
        uploaded_at,
        engine: row.get(5)?,
    })
}
