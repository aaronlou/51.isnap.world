#!/usr/bin/env bash
# ============================================
# Photo Battle Arena - 部署脚本 (Nginx + systemd)
# 支持 Ubuntu/Debian (apt) 和 CentOS/RHEL (dnf)
# 用法: sudo bash setup.sh
# ============================================
set -euo pipefail

# --- 配置（按需修改）---
INSTALL_DIR="/home/ec2-user/51.isnap.world"
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
if grep -qi "amazon linux" /etc/system-release 2>/dev/null; then
    OS="amazon"
    PKG_INSTALL="dnf install -y -q"
    PKG_UPDATE="dnf makecache -q"
    NGINX_CONF_DIR="/etc/nginx/conf.d"
    NGINX_ENABLED_DIR="/etc/nginx/conf.d"
    info "检测到 Amazon Linux (dnf)"
elif command -v apt &>/dev/null; then
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
    $PKG_INSTALL epel-release
    $PKG_UPDATE
    $PKG_INSTALL curl gcc-c++ make pkgconfig openssl-devel nginx git python3 python3-pip rsync
elif [[ "$OS" == "amazon" ]]; then
    $PKG_UPDATE
    # Amazon Linux 默认安装 curl-minimal，与 curl 包冲突，故不安装 curl
    $PKG_INSTALL gcc-c++ make pkgconfig openssl-devel nginx git python3 python3-pip rsync
fi
info "系统依赖已安装"

# ============================================
echo ""
echo "=== 2. 安装 Rust ==="
# 查找已有的 cargo（sudo 的 PATH 可能不含 $HOME/.cargo/bin）
RUST_OK=false
for CARGO_BIN in /root/.cargo/bin/cargo "$HOME/.cargo/bin/cargo" /usr/local/bin/cargo /usr/bin/cargo; do
    if [[ -x "$CARGO_BIN" ]]; then
        RUST_OK=true
        export PATH="$(dirname "$CARGO_BIN"):$PATH"
        info "Rust 已存在: $("$CARGO_BIN" --version)"
        break
    fi
done
if ! $RUST_OK; then
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

# 清理冲突：移除旧版包和旧 nodesource 仓库
if [[ "$OS" == "rhel" || "$OS" == "amazon" ]]; then
    dnf remove -y -q nodejs nodejs-full-i18n npm 2>/dev/null || true
    rm -f /etc/yum.repos.d/nodesource*.repo /etc/yum.repos.d/N|Solid*.repo 2>/dev/null || true
fi

# 检查已有 node 版本（包括 /usr/local/bin 等 sudo 可能没包含的路径）
NODE_OK=false
for NODE_BIN in /usr/local/bin/node /usr/bin/node /usr/local/node/bin/node; do
    if [[ -x "$NODE_BIN" ]]; then
        NODE_VER=$("$NODE_BIN" -v | sed 's/v//;s/\..*//')
        if [[ "$NODE_VER" -ge 18 ]] 2>/dev/null; then
            NODE_OK=true
            export PATH="$(dirname "$NODE_BIN"):$PATH"
            info "Node.js 已存在 ($NODE_BIN): $("$NODE_BIN" -v)"
            break
        fi
    fi
done

if ! $NODE_OK; then
    # 方案一: fnm（跨发行版，无需 root）
    if ! command -v fnm &>/dev/null; then
        curl -fsSL --retry 2 --connect-timeout 10 https://fnm.vercel.app/install | bash -s -- --skip-shell 2>/dev/null || true
        export PATH="$HOME/.local/share/fnm:$PATH"
        eval "$(fnm env --use-on-cd --shell bash)" 2>/dev/null || true
    fi
    if command -v fnm &>/dev/null; then
        fnm install --lts
        fnm use lts-latest
    else
        # 方案二: 官方预编译二进制（适用于国内网络，支持镜像）
        warn "fnm 不可用，直接下载 Node.js 二进制..."
        NODE_MIRROR="${NODEJS_MIRROR:-https://nodejs.org/dist}"
        NODE_VERSION="v20.18.0"
        info "Node.js 下载源: $NODE_MIRROR"
        if curl -fsSL --retry 3 --retry-delay 5 --connect-timeout 30 \
            "$NODE_MIRROR/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz" \
            -o /tmp/node.tar.xz && \
            tar -xf /tmp/node.tar.xz -C /usr/local --strip-components=1
        then
            rm -f /tmp/node.tar.xz
            hash -r  # 刷新 PATH 缓存
            if command -v node &>/dev/null; then
                info "Node.js 已安装: $(node -v)"
            else
                warn "二进制解压完成但 node 不在 PATH，尝试查找..."
                ls -la /usr/local/bin/node 2>/dev/null && \
                    export PATH="/usr/local/bin:$PATH" || \
                    warn "node 未找到，检查 tarball 结构..."
                command -v node &>/dev/null && info "Node.js 已安装: $(node -v)"
            fi
        fi
        # 二进制方案失败（下载失败或解压后 node 不可用），走 nodesource
        if ! command -v node &>/dev/null; then
            warn "二进制方案失败，尝试 nodesource..."
            curl -fsSL --retry 3 https://rpm.nodesource.com/setup_20.x | bash -
            dnf install -y -q --allowerasing nodejs 2>/dev/null || \
            dnf install -y -q nodejs
        fi
    fi
    command -v node &>/dev/null && info "Node.js 已安装: $(node -v)"
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

# 预先下载 CLIP 模型（先加载 .env 中的 HF 配置）
if [[ -f "$INSTALL_DIR/.env" ]]; then
    set -a; source "$INSTALL_DIR/.env"; set +a
fi

# 检测 HuggingFace 连通性，不可达时自动用镜像
if [[ -z "${HF_ENDPOINT:-}" ]]; then
    if ! curl -sS --connect-timeout 5 https://huggingface.co >/dev/null 2>&1; then
        warn "huggingface.co 不可达，自动切换镜像 HF_ENDPOINT=https://hf-mirror.com"
        export HF_ENDPOINT="https://hf-mirror.com"
        # 写入 .env 让 systemd 服务也能继承
        if ! grep -q "^HF_ENDPOINT=" "$INSTALL_DIR/.env" 2>/dev/null; then
            echo "" >> "$INSTALL_DIR/.env"
            echo "# 自动添加的 HuggingFace 镜像（因直连不可达）" >> "$INSTALL_DIR/.env"
            echo "HF_ENDPOINT=https://hf-mirror.com" >> "$INSTALL_DIR/.env"
            info "已写入 HF_ENDPOINT 到 $INSTALL_DIR/.env"
        fi
    fi
fi

if [[ -n "${HF_TOKEN:-}" ]]; then
    warn "检测到 HF_TOKEN，使用认证下载（速度更快）"
fi
if [[ -n "${HF_ENDPOINT:-}" ]]; then
    info "使用 HuggingFace 镜像: $HF_ENDPOINT"
fi

# 尝试预下载（设短超时，避免卡死）
MODEL_CACHE="$INSTALL_DIR/backend/scripts/.model_cache"
if timeout 120 "$INSTALL_DIR/.venv/bin/python" -c "
import os, sys
os.environ['HF_ENDPOINT'] = os.environ.get('HF_ENDPOINT', 'https://hf-mirror.com')
os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '30'
from transformers import CLIPModel, CLIPProcessor
CLIPProcessor.from_pretrained('openai/clip-vit-large-patch14', cache_dir='$MODEL_CACHE')
CLIPModel.from_pretrained('openai/clip-vit-large-patch14', cache_dir='$MODEL_CACHE')
print('OK')
" 2>/dev/null; then
    info "CLIP 模型预下载完成"
else
    warn "CLIP 模型下载失败（网络问题）"
    echo ""
    echo "   ╔══════════════════════════════════════════════════╗"
    echo "   ║  手动下载方式：                                  ║"
    echo "   ║                                                  ║"
    echo "   ║  在有网络的机器上运行:                            ║"
    echo "   ║  bash deploy/download-models.sh                  ║"
    echo "   ║                                                  ║"
    echo "   ║  然后 scp 到服务器:                               ║"
    echo "   ║  scp clip-model-cache.tar.gz 服务器IP:/tmp/      ║"
    echo "   ║  服务器上: tar -xzf /tmp/clip-model-cache.tar.gz  ║"
    echo "   ║           -C $INSTALL_DIR/backend/scripts/       ║"
    echo "   ╚══════════════════════════════════════════════════╝"
    echo ""
fi

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
elif [[ "$OS" == "rhel" || "$OS" == "amazon" ]]; then
    # CentOS/Amazon Linux: 禁用默认站点（如果存在）
    rm -f /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/welcome.conf 2>/dev/null || true
fi

# 确保 nginx 已启动（首次安装时服务未运行，reload 会失败）
nginx -t && (systemctl start nginx || true) && systemctl reload nginx
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
    elif [[ "$OS" == "rhel" || "$OS" == "amazon" ]]; then
        echo "    dnf install -y certbot python3-certbot-nginx"
        echo "    certbot --nginx -d $SERVER_NAME"
    fi
fi
echo "=========================================="
