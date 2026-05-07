#!/usr/bin/env bash
# ============================================
# Photo Battle Arena - 部署脚本 (Nginx + systemd)
# 用法: sudo bash setup.sh
# 在 Ubuntu 22.04+ / Debian 12+ 上测试
# ============================================
set -euo pipefail

# --- 配置（按需修改）---
INSTALL_DIR="/opt/photo-battle"
REPO_URL=""       # 如 git@github.com:user/repo.git，留空则使用本地目录
BRANCH="main"
SERVER_NAME="_"   # 你的域名，如 example.com

# --- 颜色 ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
err()   { echo -e "${RED}[✗]${NC} $1"; }

if [[ $EUID -ne 0 ]]; then
    err "请以 root 运行: sudo bash setup.sh"
    exit 1
fi

# ============================================
echo "=== 1. 安装系统依赖 ==="
# Rust 后端需要: openssl, pkg-config
# Nginx + 前端需要: nginx, curl (用于 nvm)
apt update -qq
apt install -y -qq curl build-essential pkg-config libssl-dev nginx git
info "系统依赖已安装"

# ============================================
echo ""
echo "=== 2. 安装 Rust ==="
if ! command -v cargo &>/dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    info "Rust 已安装: $(rustc --version)"
else
    info "Rust 已存在: $(rustc --version)"
fi

# ============================================
echo ""
echo "=== 3. 安装 Node.js (fnm + LTS) ==="
if ! command -v node &>/dev/null; then
    # 安装 fnm (轻量 Node 版本管理器)
    curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
    export PATH="$HOME/.local/share/fnm:$PATH"
    # 兼容 bash -s -- 可能导致 fnm 不在 PATH，所以直接用 bash 执行
    eval "$(fnm env --use-on-cd --shell bash)" 2>/dev/null || true
    # 如果 fnm 装不上，fallback 到 apt
    if command -v fnm &>/dev/null; then
        fnm install --lts
        fnm use lts-latest
    else
        warn "fnm 安装失败，回退到系统 Node"
        apt install -y -qq nodejs npm
    fi
    info "Node.js 已安装: $(node -v)"
else
    info "Node.js 已存在: $(node -v)"
fi

# ============================================
echo ""
echo "=== 4. 获取代码 ==="
if [[ -n "$REPO_URL" ]]; then
    if [[ -d "$INSTALL_DIR" ]]; then
        cd "$INSTALL_DIR" && git pull
    else
        git clone --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
    fi
else
    # 从本地复制（脚本假设在仓库 deploy/ 目录下运行）
    SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
    if [[ "$SCRIPT_DIR" != "$INSTALL_DIR" ]]; then
        mkdir -p "$INSTALL_DIR"
        rsync -a --exclude='deploy/.env' --exclude='backend/target' --exclude='frontend/node_modules' \
            "$SCRIPT_DIR"/ "$INSTALL_DIR"/
    fi
    info "代码已就绪: $INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# ============================================
echo ""
echo "=== 5. 创建目录和用户 ==="
mkdir -p "$INSTALL_DIR"/{data,uploads,backend,frontend}

# 创建专用用户（如果没有）
if ! id -u photo-battle &>/dev/null; then
    useradd -r -s /bin/false -m -d "$INSTALL_DIR" photo-battle
    info "创建用户: photo-battle"
fi

# 生产环境配置文件
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
    cp deploy/.env.example "$INSTALL_DIR/.env"
    warn "===== 请编辑 $INSTALL_DIR/.env，填入 GEMINI_API_KEY ====="
else
    info ".env 已存在，跳过"
fi

chown -R photo-battle:photo-battle "$INSTALL_DIR"/{data,uploads,.env}
chmod 700 "$INSTALL_DIR"/.env
info "目录和权限已设置"

# ============================================
echo ""
echo "=== 6. 构建后端 ==="
cd "$INSTALL_DIR/backend"
cargo build --release
# 减小二进制体积
strip target/release/photo-battle-backend 2>/dev/null || true
info "后端构建完成 (size: $(du -h target/release/photo-battle-backend | cut -f1))"

# ============================================
echo ""
echo "=== 7. 构建前端 ==="
cd "$INSTALL_DIR/frontend"
npm ci
npm run build
info "前端构建完成"

chown -R photo-battle:photo-battle "$INSTALL_DIR/frontend/dist"

# ============================================
echo ""
echo "=== 8. 安装 Python + VolcEngine 评分服务 ==="
if ! command -v python3 &>/dev/null; then
    apt install -y -qq python3 python3-venv python3-pip
fi

# 创建虚拟环境安装依赖（隔离项目依赖，避免污染系统 Python）
if [[ ! -d "$INSTALL_DIR/.venv" ]]; then
    python3 -m venv "$INSTALL_DIR/.venv"
fi

# PyTorch CPU 版 + 其他依赖
"$INSTALL_DIR/.venv/bin/pip" install --quiet --upgrade pip
"$INSTALL_DIR/.venv/bin/pip" install --quiet torch --index-url https://download.pytorch.org/whl/cpu
"$INSTALL_DIR/.venv/bin/pip" install --quiet -r "$INSTALL_DIR/backend/scripts/requirements.txt"

# VolcEngine systemd 服务
cp "$INSTALL_DIR/deploy/volcengine.service" /etc/systemd/system/volcengine.service
systemctl daemon-reload
systemctl enable volcengine
systemctl restart volcengine
info "VolcEngine 评分服务已启动（首次启动需下载模型权重，用时约 1-3 分钟）"

# ============================================
echo ""
echo "=== 9. 安装后端 systemd 服务 ==="
# 替换 service 文件中的 WorkingDirectory，使用正确的用户
cp "$INSTALL_DIR/deploy/photo-backend.service" /etc/systemd/system/photo-backend.service
sed -i "s/User=www-data/User=photo-battle/" /etc/systemd/system/photo-backend.service
systemctl daemon-reload
systemctl enable photo-backend
systemctl restart photo-backend
info "后端服务已启动: systemctl status photo-backend"

# ============================================
echo ""
echo "=== 10. 配置 Nginx ==="
NGINX_CONF="/etc/nginx/sites-available/photo-battle"
cp "$INSTALL_DIR/deploy/nginx.conf" "$NGINX_CONF"
sed -i "s/server_name _;/server_name $SERVER_NAME;/" "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
info "Nginx 已加载"

# ============================================
echo ""
echo "=========================================="
info "部署完成！"
echo ""
echo "  后端服务:  systemctl status photo-backend"
echo "  后端日志:  journalctl -u photo-backend -f"
echo "  Nginx:     systemctl status nginx"
echo "  配置目录:  $INSTALL_DIR"
echo "  .env 文件: $INSTALL_DIR/.env（请确保已配置密钥）"
echo ""
if [[ "$SERVER_NAME" != "_" ]]; then
    echo "  访问地址: http://$SERVER_NAME"
    echo ""
    echo "  HTTPS 配置（必须）:"
    echo "    certbot --nginx -d $SERVER_NAME"
fi
echo "=========================================="
