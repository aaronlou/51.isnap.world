#!/usr/bin/env bash
# ============================================
# CLIP 模型预下载脚本
# 在有网络的机器上运行，打包后 scp 到服务器
# ============================================
set -euo pipefail

CACHE_DIR="./.model_cache"

# 国内用户建议设镜像
if [[ -z "${HF_ENDPOINT:-}" ]]; then
    if ! curl -sS --connect-timeout 3 https://huggingface.co >/dev/null 2>&1; then
        echo "[!] huggingface.co 不可达，使用镜像 hf-mirror.com"
        export HF_ENDPOINT="https://hf-mirror.com"
    fi
fi

echo "[*] 下载 CLIP 模型 (openai/clip-vit-large-patch14)..."
python3 -c "
import os
os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '60'
from transformers import CLIPModel, CLIPProcessor
print('Downloading processor...')
CLIPProcessor.from_pretrained('openai/clip-vit-large-patch14', cache_dir='$CACHE_DIR')
print('Downloading model (~1.7GB, 可能需要几分钟)...')
CLIPModel.from_pretrained('openai/clip-vit-large-patch14', cache_dir='$CACHE_DIR')
print('Done!')
"

echo ""
echo "[*] 打包缓存..."
tar -czf clip-model-cache.tar.gz "$CACHE_DIR"

echo ""
echo "============================================"
echo "  下载完成！"
echo ""
echo "  上传到服务器:"
echo "  scp clip-model-cache.tar.gz root@你的服务器IP:/tmp/"
echo ""
echo "  服务器上解压:"
echo "  tar -xzf /tmp/clip-model-cache.tar.gz \\"
echo "      -C /home/admin/51.isnap.world/backend/scripts/"
echo "============================================"
