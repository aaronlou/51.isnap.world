const USER_ID_KEY = 'pb_user_id';

/**
 * 获取或创建匿名用户 ID
 * 首次访问时自动生成 UUID，持久化到 localStorage
 */
export function getOrCreateUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

/**
 * 获取当前用户 ID（若不存在则返回 null，不自动创建）
 */
export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

/**
 * 清除本地用户身份（调试用）
 */
export function clearUserId(): void {
  localStorage.removeItem(USER_ID_KEY);
}
