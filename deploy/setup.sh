#!/usr/bin/env bash
# ============================================
# Photo Battle Arena - 部署脚本 (Nginx + systemd)
# 支持 Ubuntu/Debian (apt) 和 CentOS/RHEL (dnf)
# 用法: sudo bash setup.sh
# ============================================
set -euo pipefail

# --- 配置（按需修改）---
INSTALL_DIR="/home/admin/51.isnap.world"
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
echo "=== 检测操作系统 ==="
OS=""
if command -v apt &>/dev/null; then
    OS="debian"
    PKG_INSTALL="apt install -y -qq"
    PKG_UPDATE="apt update -qq"
    NGINX_USER="www-data"
    NGINX_CONF_DIR="/etc/nginx/sites-available"
    NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
elif command -v dnf &>/dev/null; then
    OS="rhel"
    PKG_INSTALL="dnf install -y -q"
    PKG_UPDATE="dnf makecache -q"
    NGINX_USER="nginx"
    NGINX_CONF_DIR="/etc/nginx/conf.d"
    NGINX_ENABLED_DIR="/etc/nginx/conf.d"  # CentOS 不使用 sites-enabled
    info "检测到 CentOS/RHEL (dnf)"
elif command -v yum &>/dev/null; then
    OS="rhel"
    PKG_INSTALL="yum install -y -q"
    PKG_UPDATE="yum makecache -q"
    NGINX_USER="nginx"
    NGINX_CONF_DIR="/etc/nginx/conf.d"
    NGINX_ENABLED_DIR="/etc/nginx/conf.d"
    info "检测到 CentOS/RHEL (yum)"
else
    err "不支持的发行版，仅支持 apt (Debian/Ubuntu) 或 dnf/yum (CentOS/RHEL)"
    exit 1
fi
info "操作系统: $OS"

# ============================================
echo ""
echo "=== 1. 安装系统依赖 ==="
if [[ "$OS" == "debian" ]]; then
    $PKG_UPDATE
    $PKG_INSTALL curl build-essential pkg-config libssl-dev nginx git
elif [[ "$OS" == "rhel" ]]; then
    # EPEL 提供 nginx 和 certbot
    $PKG_INSTALL epel-release
    $PKG_UPDATE
    $PKG_INSTALL curl gcc-c++ make pkgconfig openssl-devel nginx git python3 python3-pip nodejs npm rsync
fi
info "系统依赖已安装"

# ============================================
echo ""
echo "=== 2. 安装 Rust ==="
if command -v cargo &>/dev/null; then
    info "Rust 已存在: $(rustc --version)"
else
    # 国内用户可设置镜像加速：
    #   export RUSTUP_DIST_SERVER=https://mirrors.ustc.edu.cn/rust-static
    #   export RUSTUP_UPDATE_ROOT=https://mirrors.ustc.edu.cn/rust-static/rustup
    if [[ -n "${RUSTUP_DIST_SERVER:-}" ]]; then
        info "使用 Rust 镜像: $RUSTUP_DIST_SERVER"
    fi
    warn "正在下载 Rust 安装程序（网络较慢时可能需数分钟）..."
    curl --proto '=https' --tlsv1.2 -sSf --retry 3 --retry-delay 5 https://sh.rustup.rs \
        | sh -s -- -y --no-modify-path
    source "$HOME/.cargo/env"
    info "Rust 已安装: $(rustc --version)"
fi

# ============================================
echo ""
echo "=== 3. 安装 Node.js (>= 18) ==="
# 检查版本，现有 node 太旧也会升级
NODE_OK=false
if command -v node &>/dev/null; then
    NODE_VER=$(node -v | sed 's/v//;s/\..*//')
    if [[ "$NODE_VER" -ge 18 ]] 2>/dev/null; then
        NODE_OK=true
        info "Node.js 已存在: $(node -v)"
    else
        warn "Node.js 版本过旧 ($(node -v))，需要 >= 18，准备升级..."
    fi
fi

if ! $NODE_OK; then
    # 用 fnm 安装（轻量 Node 版本管理器，无需 root，兼容 all distros）
    if ! command -v fnm &>/dev/null; then
        curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell 2>/dev/null || true
        export PATH="$HOME/.local/share/fnm:$PATH"
        eval "$(fnm env --use-on-cd --shell bash)" 2>/dev/null || true
    fi
    if command -v fnm &>/dev/null; then
        fnm install --lts
        fnm use lts-latest
    else
        warn "fnm 不可用（国内网络可能被墙），直接下载 Node.js 二进制..."
        # 移除旧版 nodejs 包，避免冲突
        dnf remove -y -q nodejs nodejs-full-i18n 2>/dev/null || true
        # Node.js 镜像（国内用 npmmirror）
        NODE_MIRROR="${NODEJS_MIRROR:-https://nodejs.org/dist}"
        info "Node.js 下载源: $NODE_MIRROR"
        curl -fsSL --retry 3 --retry-delay 5 \
            "$NODE_MIRROR/v20.18.0/node-v20.18.0-linux-x64.tar.xz" \
            -o /tmp/node.tar.xz && \
        tar -xf /tmp/node.tar.xz -C /usr/local --strip-components=1 && \
        rm -f /tmp/node.tar.xz && \
        info "Node.js 已安装: $(node -v)" || {
            warn "二进制下载失败，尝试 nodesource 仓库..."
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            dnf install -y -q nodejs 2>/dev/null || \
            dnf install -y -q --allowerasing nodejs 2>/dev/null || \
            dnf install -y -q nodejs
        }
    fi
    info "Node.js 已安装: $(node -v)"
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

if ! id -u photo-battle &>/dev/null; then
    useradd -r -s /bin/false photo-battle
    info "创建用户: photo-battle"
fi

# 生产环境配置文件
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
    cp deploy/.env.example "$INSTALL_DIR/.env"
    warn "===== 请编辑 $INSTALL_DIR/.env，填入以下配置 ====="
    warn "  1. GEMINI_API_KEY — Gemini API 密钥（必填）"
    warn "  2. HF_TOKEN — HuggingFace Token（推荐，加速 CLIP 模型下载）"
    warn "  3. HF_ENDPOINT — 国内用户设为 https://hf-mirror.com"
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

# 确保 Nginx 能读取前端文件
chmod -R o+rX "$INSTALL_DIR/frontend/dist"

# ============================================
echo ""
echo "=== 8. 安装 Python + VolcEngine 评分服务 ==="
if ! command -v python3 &>/dev/null; then
    if [[ "$OS" == "debian" ]]; then
        $PKG_INSTALL python3 python3-venv python3-pip
    else
        $PKG_INSTALL python3 python3-pip
    fi
fi

# 创建虚拟环境
if [[ ! -d "$INSTALL_DIR/.venv" ]]; then
    if ! python3 -m venv "$INSTALL_DIR/.venv" 2>/dev/null; then
        warn "python3 -m venv 不可用，尝试安装 python3-venv..."
        # CentOS 9 无需单独安装，若失败则用 ensurepip
        python3 -m ensurepip --upgrade 2>/dev/null || true
        python3 -m venv --without-pip "$INSTALL_DIR/.venv" 2>/dev/null || \
        python3 -m venv "$INSTALL_DIR/.venv"
    fi
fi

# PyTorch CPU 版 + 其他依赖
"$INSTALL_DIR/.venv/bin/pip" install --quiet --upgrade pip
"$INSTALL_DIR/.venv/bin/pip" install --quiet torch --index-url https://download.pytorch.org/whl/cpu
"$INSTALL_DIR/.venv/bin/pip" install --quiet -r "$INSTALL_DIR/backend/scripts/requirements.txt"

# 预先下载 CLIP 模型
if [[ -n "${HF_TOKEN:-}" ]]; then
    warn "检测到 HF_TOKEN，使用认证下载（速度更快）"
fi
if [[ -n "${HF_ENDPOINT:-}" ]]; then
    info "使用 HuggingFace 镜像: $HF_ENDPOINT"
fi
# 先加载 .env 中的 HF 配置
if [[ -f "$INSTALL_DIR/.env" ]]; then
    set -a; source "$INSTALL_DIR/.env"; set +a
fi
"$INSTALL_DIR/.venv/bin/python" -c "
from transformers import CLIPModel, CLIPProcessor
CLIPProcessor.from_pretrained('openai/clip-vit-large-patch14', cache_dir='$INSTALL_DIR/backend/scripts/.model_cache')
CLIPModel.from_pretrained('openai/clip-vit-large-patch14', cache_dir='$INSTALL_DIR/backend/scripts/.model_cache')
print('CLIP model downloaded')
" && info "CLIP 模型预下载完成" || warn "CLIP 模型下载超时，服务启动后会自动重试"

# VolcEngine systemd 服务
cp "$INSTALL_DIR/deploy/volcengine.service" /etc/systemd/system/volcengine.service
sed -i "s|__INSTALL_DIR__|$INSTALL_DIR|g" /etc/systemd/system/volcengine.service
systemctl daemon-reload
systemctl enable volcengine
systemctl restart volcengine
info "VolcEngine 评分服务已启动（首次启动需下载模型权重，用时约 1-3 分钟）"

# ============================================
echo ""
echo "=== 9. 安装后端 systemd 服务 ==="
cp "$INSTALL_DIR/deploy/photo-backend.service" /etc/systemd/system/photo-backend.service
sed -i "s|__INSTALL_DIR__|$INSTALL_DIR|g" /etc/systemd/system/photo-backend.service
systemctl daemon-reload
systemctl enable photo-backend
systemctl restart photo-backend
info "后端服务已启动: systemctl status photo-backend"

# ============================================
echo ""
echo "=== 10. 配置 Nginx ==="
NGINX_CONF="$NGINX_CONF_DIR/photo-battle.conf"
cp "$INSTALL_DIR/deploy/nginx.conf" "$NGINX_CONF"
sed -i "s|__INSTALL_DIR__|$INSTALL_DIR|g" "$NGINX_CONF"
sed -i "s/server_name _;/server_name $SERVER_NAME;/" "$NGINX_CONF"

if [[ "$OS" == "debian" ]]; then
    # Debian 需要确保 symlink 存在
    ln -sf "$NGINX_CONF" "$NGINX_ENABLED_DIR/"
    rm -f /etc/nginx/sites-enabled/default
elif [[ "$OS" == "rhel" ]]; then
    # CentOS: 禁用默认站点（如果存在）
    rm -f /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/welcome.conf 2>/dev/null || true
fi

nginx -t && systemctl reload nginx
info "Nginx 已加载"

# ============================================
echo ""
echo "=========================================="
info "部署完成！"
echo ""
echo "  后端服务:  systemctl status photo-backend"
echo "  后端日志:  journalctl -u photo-backend -f"
echo "  VolcEngine: journalctl -u volcengine -f"
echo "  Nginx:     systemctl status nginx"
echo "  配置目录:  $INSTALL_DIR"
echo "  .env 文件: $INSTALL_DIR/.env（请确保已配置密钥）"
echo ""
if [[ "$SERVER_NAME" != "_" ]]; then
    echo "  访问地址: http://$SERVER_NAME"
    echo ""
    echo "  HTTPS 配置（必须）:"
    if [[ "$OS" == "debian" ]]; then
        echo "    certbot --nginx -d $SERVER_NAME"
    elif [[ "$OS" == "rhel" ]]; then
        echo "    dnf install -y certbot python3-certbot-nginx"
        echo "    certbot --nginx -d $SERVER_NAME"
    fi
fi
echo "=========================================="
