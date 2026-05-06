# 📸 五一假期 · 快门奇遇记 (Shutter Quest)

一个轻松有趣的 AI 摄影探索平台。上传你的 JPG 摄影作品，让 AI 摄影伙伴为你带来意想不到的专业点评和灵感启发。

支持两种 AI 点评引擎：
- **Gemini 2.0 Pro** - Google 多模态大模型，通用图像理解与启发
- **ArtiMuse** (CVPR 2026) - 专业图像美学评估模型，8 维度深度洞察

## 功能

- 🎯 **上传作品**：支持 JPG 格式，最大 30MB
- 🤖 **双引擎 AI 评分**：
  - Gemini：通用评审，给出综合分数和点评
  - ArtiMuse：专业美学评估，从 8 个维度深度分析（构图、视觉元素、技术执行、原创性、主题表达、情感共鸣、整体完形、综合评价）
- 🏆 **冠军殿堂**：实时展示评分最高的前三名作品
- 🎮 **游戏化体验**：街机风格的界面设计，评分揭晓动画，等级评定系统
- 🌅 **五一假期主题**：专属节日氛围，假期摄影大乱斗

## 技术栈

- **前端**：React + TypeScript + Vite + Tailwind CSS + Framer Motion
- **后端**：Rust + Axum + Tokio
- **AI 引擎**：Gemini 2.0 Pro / ArtiMuse (InternVL-3 架构)

## 快速开始

### 1. 配置环境变量

```bash
cp .env .env.local
# 编辑 .env.local
```

### 2. 启动后端

```bash
cd backend
cargo run
```

后端服务将在 `http://localhost:3001` 启动。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动。

### 4. 打开浏览器访问

打开 http://localhost:3000 即可使用！

---

## 🔬 ArtiMuse 集成（可选，推荐用于专业评分）

[ArtiMuse](https://github.com/thunderbolt215/ArtiMuse) 是 CVPR 2026 的专业图像美学评估模型，相比 Gemini 更专注于摄影美学领域，能提供 8 个维度的深度专业点评。

### 前置要求

- **GPU**：NVIDIA GPU，显存 ≥ 16GB（推荐 24GB）
- **Python**：≥ 3.9
- **CUDA**：已安装

### 部署步骤

1. **克隆 ArtiMuse 到服务器**

```bash
git clone https://github.com/thunderbolt215/ArtiMuse.git
cd ArtiMuse
```

2. **创建环境并安装依赖**

```bash
conda create -n artimuse python=3.10
conda activate artimuse
pip install -r requirements.txt
pip install fastapi uvicorn
# 可选加速
pip install flash-attn --no-build-isolation
```

3. **下载模型权重**

从 [Hugging Face](https://huggingface.co/Thunderbolt215215/ArtiMuse) 或 [ModelScope](https://modelscope.cn/models/thunderbolt/ArtiMuse) 下载模型，放到 `checkpoints/ArtiMuse/` 目录下。

4. **启动 ArtiMuse API 服务**

```bash
conda activate artimuse
python api_server.py --model_name ArtiMuse --device cuda:0 --port 8000
```

服务将在 `http://localhost:8000` 启动，模型加载一次后常驻内存。

5. **启用 ArtiMuse 评分**

编辑摄影大乱斗项目的 `.env.local`：

```bash
ARTIMUSE_ENABLED=true
ARTIMUSE_URL=http://127.0.0.1:8000
```

然后重启摄影大乱斗后端即可。

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| POST | /api/upload | 上传照片 |
| GET | /api/photos | 获取所有照片 |
| POST | /api/photos/:id/score | 对照片进行 AI 评分 |
| GET | /api/leaderboard | 获取排行榜（前三名） |

## 评分等级

| 分数 | 等级 |
|------|------|
| 4.5+ | 五一摄影传奇 |
| 4.0+ | 假期摄影大师 |
| 3.5+ | 旅途摄影达人 |
| 3.0+ | 假日进阶级 |
| 2.0+ | 入门旅行者 |
| < 2.0 | 假期练习中 |

## 后端模块结构

```
backend/src/
├── main.rs          # 入口，路由注册，服务启动
├── models.rs        # Photo、ScoreResponse 数据结构
├── state.rs         # AppState 及构造方法
├── utils.rs         # MAX_FILE_SIZE、is_jpeg 工具函数
├── routes/
│   ├── mod.rs       # 路由模块导出
│   ├── health.rs    # /api/health
│   ├── leaderboard.rs
│   └── photos.rs    # 上传、列表、评分
└── services/
    ├── mod.rs
    ├── artimuse.rs  # ArtiMuse API 调用
    └── gemini.rs    # Gemini API 调用
```

## 注意事项

- 如果没有配置任何评分引擎，系统会返回模拟评分（3.5 分）
- 如果同时配置了 Gemini 和 ArtiMuse，优先使用 ArtiMuse（当 `ARTIMUSE_ENABLED=true` 时）
- 所有上传的照片保存在 `backend/uploads/` 目录下
- 数据存储在 `/app/data/photos.db`，重启后端不会清空
- ArtiMuse 首次加载模型需要数分钟（取决于 GPU 性能），后续评分秒级响应

---

## Docker 部署（推荐）

### 前置要求

- Docker Engine ≥ 24.0
- Docker Compose ≥ 2.20

### 快速启动

```bash
# 1. 从模板创建环境配置并填入 API Key
cp .env.example .env
# 编辑 .env，填入 GEMINI_API_KEY 等配置

# 2. 一键启动所有服务
docker compose up -d

# 3. 打开浏览器访问
open http://localhost:8080
```

### 服务架构

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  浏览器      │────▶│  前端 Nginx   │────▶│  Rust 后端 API    │
│  localhost   │     │  port 8080   │     │  port 3001       │
│   :8080      │     │  /api → backend │     │                  │
└─────────────┘     └──────────────┘     └───┬──────────────┘
                                             │
                                             ▼
                                      ┌──────────────────┐
                                      │ VolcEngine 美学评分  │
                                      │ port 8001         │
                                      │ CLIP + LAION MLP  │
                                      └──────────────────┘
```

### 各服务说明

| 服务 | 镜像 | 端口 |
|------|------|------|
| `frontend` | nginx (静态文件) | 8080 |
| `backend` | Rust (Axum) | 3001 |
| `volcengine` | Python (FastAPI) | 8001 |

### 数据持久化

Docker Compose 使用命名卷持久化数据，`docker compose down` 不会丢失：

- `backend_uploads` → 上传的照片
- `backend_db` → SQLite 数据库（含评分记录）
- `volcengine_cache` → CLIP 模型权重缓存

### 查看日志

```bash
# 所有服务
docker compose logs -f

# 单个服务
docker compose logs -f backend
docker compose logs -f volcengine
```

### 常用命令

```bash
# 构建并启动
docker compose up -d

# 查看状态
docker compose ps

# 停止
docker compose down

# 重新构建（代码变更后）
docker compose build --no-cache backend
docker compose up -d

# 完全重置（清空所有数据）
docker compose down -v
docker compose up -d
```
