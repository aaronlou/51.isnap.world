use super::errors::DomainError;

const JPEG_MAGIC: [u8; 3] = [0xFF, 0xD8, 0xFF];

/// 文件上传策略值对象
/// 封装文件验证规则，消除验证逻辑的重复
#[derive(Debug, Clone)]
pub struct FileUpload {
    pub filename: String,
    pub data: Vec<u8>,
}

impl FileUpload {
    pub const MAX_SIZE: usize = 30 * 1024 * 1024; // 30MB

    pub fn validate(filename: String, data: Vec<u8>) -> Result<Self, DomainError> {
        if data.len() > Self::MAX_SIZE {
            return Err(DomainError::FileTooLarge {
                size: data.len(),
                max: Self::MAX_SIZE,
            });
        }
        if !Self::is_jpeg(&data) {
            return Err(DomainError::InvalidFileFormat(
                "Only JPEG files are supported".to_string(),
            ));
        }
        Ok(Self { filename, data })
    }

    fn is_jpeg(data: &[u8]) -> bool {
        data.len() >= 3 && data[..3] == JPEG_MAGIC
    }
}
