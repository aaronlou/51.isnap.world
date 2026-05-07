#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Photo Battle Arena - 部署脚本 (Nginx + systemd)
# 目标: 将项目部署到 /opt/photo-battle
# 用法: 在服务器上以 root 运行
#   curl -fsSL https://你的仓库/raw/deploy/setup.sh | bash
# 或手动按步骤执行
# ============================================

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_DIR="/opt/photo-battle"

echo "=== 1. 创建目录结构 ==="
mkdir -p "$INSTALL_DIR"/{backend,frontend,data,uploads}
echo "   目录: $INSTALL_DIR"

echo ""
echo "=== 2. 构建后端 ==="
cd "$REPO_DIR/backend"
cargo build --release --target-dir "$INSTALL_DIR/backend/target"
# 复制二进制到 install 目录（其实已经在 target 里了）
echo "   后端二进制: $INSTALL_DIR/backend/target/release/photo-battle-backend"

echo ""
echo "=== 3. 构建前端 ==="
cd "$REPO_DIR/frontend"
npm ci
npm run build
cp -r dist "$INSTALL_DIR/frontend/dist"
echo "   前端静态文件: $INSTALL_DIR/frontend/dist"

echo ""
echo "=== 4. 安装 systemd 服务 ==="
cp "$REPO_DIR/deploy/photo-backend.service" /etc/systemd/system/photo-backend.service
systemctl daemon-reload
systemctl enable photo-backend
systemctl start photo-backend
echo "   服务状态:"
systemctl status photo-backend --no-pager

echo ""
echo "=== 5. 安装 Nginx 配置 ==="
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi
cp "$REPO_DIR/deploy/nginx.conf" /etc/nginx/sites-available/photo-battle
ln -sf /etc/nginx/sites-available/photo-battle /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "   Nginx 已重新加载"

echo ""
echo "=== 部署完成 ==="
echo "   后端: systemctl restart photo-backend"
echo "   日志: journalctl -u photo-backend -f"
echo "   前端: 直接修改 frontend/src 后重新 npm run build 并复制 dist"
