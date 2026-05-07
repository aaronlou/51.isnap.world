#!/bin/bash
set -e

cd "$(dirname "$0")/.."

NETWORK="photo-battle"

# 创建网络
if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
    docker network create "$NETWORK"
    echo "[✓] 创建 Docker 网络: $NETWORK"
fi

# 创建持久化卷
for vol in backend_uploads backend_db volcengine_cache caddy_data caddy_config; do
    if ! docker volume inspect "$vol" >/dev/null 2>&1; then
        docker volume create "$vol"
    fi
done

# 构建镜像
echo "=== 构建后端镜像 ==="
docker build -t photo-battle-backend ./backend

echo "=== 构建 VolcEngine 镜像 ==="
docker build -t photo-battle-volcengine -f ./backend/scripts/Dockerfile ./backend

echo "=== 构建前端镜像 ==="
docker build -t photo-battle-frontend ./frontend

echo "=== 拉取 Caddy 镜像 ==="
docker pull caddy:2-alpine

# 清理旧容器（如果存在）
for svc in volcengine backend frontend caddy; do
    docker rm -f "photo-battle-$svc" 2>/dev/null || true
done

# 启动 VolcEngine
echo "=== 启动 VolcEngine ==="
docker run -d \
  --name photo-battle-volcengine \
  --network "$NETWORK" \
  -v backend_uploads:/app/uploads \
  -v volcengine_cache:/app/scripts/.model_cache \
  -e VOLCENGINE_PORT=8001 \
  -e VOLCENGINE_DEVICE=cpu \
  --restart unless-stopped \
  photo-battle-volcengine

# 等待 VolcEngine 就绪（模型加载需要时间）
echo "=== 等待 VolcEngine 就绪（首次需下载模型，约 2-5 分钟）==="
for i in {1..60}; do
    if curl -sf http://localhost:8001/health >/dev/null 2>&1; then
        echo "[✓] VolcEngine 就绪"
        break
    fi
    echo -n "."
    sleep 5
done

# 启动后端
echo "=== 启动后端 ==="
docker run -d \
  --name photo-battle-backend \
  --network "$NETWORK" \
  -p 3001:3001 \
  -v backend_uploads:/app/uploads \
  -v backend_db:/app/data \
  --env-file .env \
  -e VOLCENGINE_URL=http://volcengine:8001 \
  -e BASE_URL=https://photo.innergrow.ai \
  -e DATABASE_PATH=/app/data/photos.db \
  -e UPLOAD_DIR=/app/uploads \
  --restart unless-stopped \
  photo-battle-backend

# 启动前端
echo "=== 启动前端 ==="
docker run -d \
  --name photo-battle-frontend \
  --network "$NETWORK" \
  --restart unless-stopped \
  photo-battle-frontend

# 启动 Caddy
echo "=== 启动 Caddy ==="
docker run -d \
  --name photo-battle-caddy \
  --network "$NETWORK" \
  -p 80:80 \
  -p 443:443 \
  -p 443:443/udp \
  -v "$(pwd)/Caddyfile:/etc/caddy/Caddyfile:ro" \
  -v caddy_data:/data \
  -v caddy_config:/config \
  --restart unless-stopped \
  caddy:2-alpine

echo ""
echo "=========================================="
echo "[✓] 所有服务已启动！"
echo ""
echo "查看日志:"
echo "  docker logs -f photo-battle-caddy"
echo "  docker logs -f photo-battle-backend"
echo "  docker logs -f photo-battle-volcengine"
echo ""
echo "停止所有服务:"
echo "  bash deploy/docker-stop.sh"
echo "=========================================="
