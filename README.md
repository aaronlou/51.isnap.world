# 📸 五一假期 · 快门奇遇记 (Shutter Quest)

一个轻松有趣的 AI 摄影探索平台。上传 JPG 摄影作品，让 AI 伙伴为你带来专业点评和灵感启发。

## 评分引擎（优先级链）

| 引擎 | 优先级 | 说明 | 依赖 |
|------|--------|------|------|
| **Gemini 2.0 Pro** | 🥇 最高 | Google 多模态大模型，通用图像理解 | API Key |
| **VolcEngine** | 🥈 | 本地 CLIP-ViT-L/14 + LAION MLP 美学模型，0-1 分标准化评分 | Python + PyTorch CPU |
| **ArtiMuse** | 🥉 | CVPR 2026 专业图像美学评估模型，8 维度深度洞察 | GPU ≥ 16GB |
| **Simulated** | ⚪ 兜底 | 所有引擎不可用时返回模拟评分 | 无需额外配置 |

评分协调器按优先级顺序尝试，一个引擎成功即返回，失败自动降级。

## 技术栈

- **前端**：React 18 + TypeScript + Vite 5 + Tailwind CSS + Framer Motion
- **后端**：Rust + Axum + Tokio + rusqlite + SQLite
- **评分引擎**：VolcEngine (LAION Aesthetics V2) / ArtiMuse / Gemini 2.0 Pro
- **部署**：Docker Compose / Nginx + systemd

## 快速开始（开发环境）

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入 GEMINI_API_KEY
```

### 2. 启动 VolcEngine 评分服务（可选但推荐）

```bash
cd backend/scripts
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
python volcengine_aesthetic_server.py
# 监听 http://127.0.0.1:8001
```

### 3. 启动后端

```bash
cd backend
cargo run
# 监听 http://localhost:3001
```

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
# 监听 http://localhost:3000
```

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/upload` | 上传照片 (multipart, max 30MB) |
| GET | `/api/photos` | 获取所有照片 |
| POST | `/api/photos/:id/score` | 对照片进行 AI 评分 |
| GET | `/api/leaderboard` | 获取排行榜（前三名） |

## 评分等级

| 分数 | 等级 |
|------|------|
| 4.5+ | 五一摄影传奇 |
| 4.0+ | 假期摄影大师 |
| 3.5+ | 旅途摄影达人 |
| 3.0+ | 假日进阶级 |
| 2.0+ | 入门旅行者 |
| < 2.0 | 假期练习中 |

---

## 项目架构

### DDD 四层架构

```
backend/src/
├── main.rs                    # 组合根（DI 容器）
├── domain/                    # 领域层 — 纯业务逻辑，无外部依赖
│   ├── photo.rs               # 实体 + 值对象 (PhotoId)
│   ├── score.rs               # 值对象 (Score) — 校验 + 归一化
│   ├── file.rs                # 值对象 (FileUpload) — 文件校验
│   ├── scoring.rs             # 领域服务 (ScoringCoordinator) + 端口 (ScoringEngine)
│   ├── repository.rs          # 端口 (PhotoRepository, FileStorage)
│   └── errors.rs              # DomainError 枚举
├── application/               # 应用层 — 用例 + DTO
│   ├── dto.rs                 # PhotoDto, ScoreResultDto
│   └── use_cases/
│       ├── upload_photo.rs
│       ├── score_photo.rs
│       ├── list_photos.rs
│       └── get_leaderboard.rs
├── infrastructure/            # 基础设施层 — 实现领域端口
│   ├── db/sqlite.rs           # PhotoRepository 实现 (rusqlite)
│   ├── http/
│   │   ├── gemini_client.rs   # ScoringEngine 实现 + ACL
│   │   ├── artimuse_client.rs # ScoringEngine 实现 + ACL
│   │   └── volcengine_client.rs # ScoringEngine 实现 + ACL
│   └── storage/
│       └── local_file_storage.rs # FileStorage 实现
└── presentation/              # 表现层 — Axum 路由 + 错误映射
    ├── error.rs               # DomainError → HTTP 状态码
    └── routes/
        ├── photos.rs
        ├── leaderboard.rs
        └── health.rs
```

### 评分引擎调度架构

```
┌─────────────┐     ┌──────────────────┐
│  Scoring     │────▶│  VolcEngine       │ ← 优先
│  Coordinator │────▶│  (本地 Python CPU) │
│  (领域服务)    │────▶│  ArtiMuse         │ ← 降级
│              │────▶│  (GPU 服务)        │
│              │────▶│  Gemini 2.0 Pro   │ ← 降级
│              │────▶│  Simulated        │ ← 最终兜底
└─────────────┘     └──────────────────┘
```

---

## Docker 部署

### 前置要求

- Docker Engine ≥ 24.0
- Docker Compose ≥ 2.20

### 快速启动

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 GEMINI_API_KEY

# 2. 一键启动
docker compose up -d

# 3. 访问
open http://localhost:8080
```

### 服务架构

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  浏览器      │────▶│  前端 Nginx   │────▶│  Rust 后端 API    │
│  port 8080  │     │  port 80     │     │  port 3001       │
│             │     │  /api 反代    │     │                  │
└─────────────┘     └──────────────┘     └───┬──────────────┘
                                              │
                                              ▼
                                       ┌──────────────────┐
                                       │ VolcEngine 美学评分  │
                                       │ port 8001         │
                                       │ CLIP + LAION MLP  │
                                       └──────────────────┘
```

### 常用命令

```bash
docker compose up -d              # 启动
docker compose logs -f backend    # 查看后端日志
docker compose down               # 停止
docker compose build --no-cache backend && docker compose up -d  # 代码变更后重建
```

---

## 部署到服务器（Nginx + systemd，无需 Docker）

适合在 Ubuntu 22.04+ / Debian 12+ / CentOS Stream 9 上使用。

### 前置准备

```bash
# 克隆代码
git clone <your-repo> /home/admin/51.isnap.world
cd /home/admin/51.isnap.world

# 配置环境变量
cp deploy/.env.example .env
vim .env   # 填入 GEMINI_API_KEY，可选 HF_TOKEN

# 国内加速（可选）
export RUSTUP_DIST_SERVER=https://mirrors.ustc.edu.cn/rust-static
export NODEJS_MIRROR=https://npmmirror.com/mirrors/node
```

### 一键部署

```bash
sudo bash deploy/setup.sh
```

脚本自动完成：
1. 安装系统依赖（自动识别 apt/dnf）
2. 安装 Rust
3. 安装 Node.js ≥ 18
4. 构建前后端
5. 安装 Python 虚拟环境 + VolcEngine 评分服务
6. 配置 systemd 服务（后端 + VolcEngine）
7. 配置 Nginx 反向代理

### 部署后维护

```bash
# 查看日志
journalctl -u photo-backend -f
journalctl -u volcengine -f

# 更新代码后重新部署
git pull
cd backend && cargo build --release && systemctl restart photo-backend
cd frontend && npm ci && npm run build

# HTTPS（需要域名）
certbot --nginx -d yourdomain.com
```

### 部署文件说明

```
deploy/
├── setup.sh                 # 一键部署脚本
├── nginx.conf               # Nginx 配置模板（含 __INSTALL_DIR__ 占位符）
├── photo-backend.service    # 后端 systemd 服务
├── volcengine.service       # VolcEngine systemd 服务
└── .env.example             # 生产环境变量模板
```

---

## 注意事项

- 评分引擎按 Gemini → VolcEngine → ArtiMuse → Simulated 顺序优先级调度（有 GEMINI_API_KEY 时优先使用）
- VolcEngine 使用本地 CPU 推理，无需 API Key 和外网连接（但首次启动需下载 ~1.7GB 的 CLIP 模型）
- 建议配置 `HF_TOKEN` 和 `HF_ENDPOINT=https://hf-mirror.com` 加速 CLIP 模型下载
- 所有上传的照片保存在 `UPLOAD_DIR`（默认 `./uploads/`）
- 数据存储在 `DATABASE_PATH`（默认 `./photos.db`）
- 前后端分离架构，生产环境通过 Nginx 反代
