#!/bin/bash

echo "=== 停止所有 Photo Battle 容器 ==="
for svc in caddy frontend backend volcengine; do
    docker stop "photo-battle-$svc" 2>/dev/null || true
    docker rm "photo-battle-$svc" 2>/dev/null || true
    echo "[✓] 已停止 photo-battle-$svc"
done

echo "[✓] 全部停止"
