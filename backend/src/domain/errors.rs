use thiserror::Error;

#[derive(Error, Debug, Clone)]
pub enum DomainError {
    #[error("File too large: {size} bytes (max {max} bytes)")]
    FileTooLarge { size: usize, max: usize },

    #[error("Invalid file format: {0}")]
    InvalidFileFormat(String),

    #[error("Photo not found: {0}")]
    PhotoNotFound(String),

    #[error("Photo already scored")]
    AlreadyScored,

    #[error("Scoring engine unavailable: {0}")]
    EngineUnavailable(String),

    #[error("Invalid score: {0}")]
    InvalidScore(String),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("No file provided")]
    MissingFile,

    #[error("Multipart error: {0}")]
    MultipartError(String),
}
