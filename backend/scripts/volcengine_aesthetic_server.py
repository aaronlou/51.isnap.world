#!/usr/bin/env python3
"""
VolcEngine 美学评分服务 - 火山引擎同款 LAION Aesthetics V2 模型

基于开源 CLIP-ViT-L/14 + MLP 美学预测器，实现与火山引擎 LAS 算子广场
「图像美学评分」相同的评分能力：
  - CLIP 模型: openai/clip-vit-large-patch14
  - MLP 权重: laion_aesthetic_v2/sac+logos+ava1-l14-linearMSE.pth
  - 输出范围: 0.0-1.0（标准化美学分数，越高表示美学质量越好）

启动方式:
    pip install fastapi uvicorn torch transformers pillow numpy
    python backend/scripts/volcengine_aesthetic_server.py

环境变量:
    VOLCENGINE_PORT - 服务端口，默认 8001
    VOLCENGINE_DEVICE - 推理设备，默认 cpu （可设为 cuda）
"""

import os
import io
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import CLIPModel, CLIPProcessor

# 配置
PORT = int(os.environ.get("VOLCENGINE_PORT", "8001"))
DEVICE = os.environ.get("VOLCENGINE_DEVICE", "cpu")
MODEL_NAME = "openai/clip-vit-large-patch14"
MLP_WEIGHTS_URL = (
    "https://github.com/christophschuhmann/"
    "improved-aesthetic-predictor/raw/main/sac+logos+ava1-l14-linearMSE.pth"
)

app = FastAPI(title="VolcEngine Aesthetic Scoring", version="1.0.0")


class ScoreRequest(BaseModel):
    image_path: str


class ScoreResponse(BaseModel):
    aesthetic_score: float
    score: float
    review: Optional[str] = None


# 全局模型缓存
_clip_model: Optional[CLIPModel] = None
_clip_processor: Optional[CLIPProcessor] = None
_mlp: Optional[nn.Module] = None


def get_cache_dir() -> str:
    """获取模型缓存目录"""
    cache = os.path.join(os.path.dirname(__file__), ".model_cache")
    os.makedirs(cache, exist_ok=True)
    return cache


def download_mlp_weights(cache_dir: str) -> str:
    """下载 LAION MLP 权重文件"""
    weights_path = os.path.join(cache_dir, "sac+logos+ava1-l14-linearMSE.pth")
    if os.path.exists(weights_path):
        return weights_path

    print("[下载] LAION Aesthetic MLP 权重中...")
    import urllib.request

    try:
        urllib.request.urlretrieve(MLP_WEIGHTS_URL, weights_path)
        print(f"[完成] 权重已保存至 {weights_path}")
    except Exception as e:
        # 若 GitHub 下载失败，尝试从 HuggingFace 镜像下载
        hf_url = (
            "https://huggingface.co/christophschuhmann/"
            "improved-aesthetic-predictor/resolve/main/sac+logos+ava1-l14-linearMSE.pth"
        )
        print(f"[重试] 从 HuggingFace 镜像下载...")
        urllib.request.urlretrieve(hf_url, weights_path)
        print(f"[完成] 权重已保存至 {weights_path}")
    return weights_path


class AestheticMLP(nn.Module):
    """简单的线性 MLP，将 CLIP 图像特征映射到美学分数"""

    def __init__(self, input_size: int = 768):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 1024),
            nn.Dropout(0.2),
            nn.Linear(1024, 128),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.Dropout(0.1),
            nn.Linear(64, 16),
            nn.Linear(16, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.layers(x)


def load_models():
    """加载 CLIP 和 MLP 模型"""
    global _clip_model, _clip_processor, _mlp

    if _clip_model is not None:
        return

    cache_dir = get_cache_dir()
    print(f"[加载] CLIP 模型: {MODEL_NAME}")
    print(f"[加载] 设备: {DEVICE}")

    _clip_processor = CLIPProcessor.from_pretrained(MODEL_NAME, cache_dir=cache_dir)
    _clip_model = CLIPModel.from_pretrained(MODEL_NAME, cache_dir=cache_dir).to(DEVICE)
    _clip_model.eval()

    # 加载 MLP 权重
    weights_path = download_mlp_weights(cache_dir)
    _mlp = AestheticMLP(input_size=768).to(DEVICE)

    state_dict = torch.load(weights_path, map_location=DEVICE, weights_only=True)
    _mlp.load_state_dict(state_dict)
    _mlp.eval()

    print("[就绪] VolcEngine 美学评分模型加载完成")


def generate_review(score: float) -> str:
    """根据美学分数生成点评"""
    if score >= 0.85:
        return "构图精妙，色彩和谐，具有专业级视觉冲击力。"
    elif score >= 0.70:
        return "整体观感良好，构图与光影处理较为出色。"
    elif score >= 0.55:
        return "具有一定美感，但在构图或色彩上仍有提升空间。"
    elif score >= 0.40:
        return "表现平平，建议关注主体突出与画面平衡。"
    elif score >= 0.25:
        return "视觉吸引力有限，可从构图和光线入手改进。"
    else:
        return "画面表现较弱，建议学习基础构图与色彩理论。"


def predict_aesthetic(image_path: str) -> float:
    """对图像进行美学评分"""
    load_models()

    image = Image.open(image_path).convert("RGB")

    # CLIP 预处理
    inputs = _clip_processor(images=image, return_tensors="pt")
    pixel_values = inputs["pixel_values"].to(DEVICE)

    with torch.no_grad():
        # 提取 CLIP 图像特征
        image_features = _clip_model.get_image_features(pixel_values=pixel_values)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)

        # MLP 预测
        prediction = _mlp(image_features)

    # sigmoid 标准化到 0-1
    score = torch.sigmoid(prediction).item()
    return float(score)


@app.on_event("startup")
async def startup_event():
    """服务启动，模型采用懒加载（首次评分请求时加载）"""
    print("=" * 50)
    print("火山引擎同款图像美学评分服务")
    print("=" * 50)
    print("[提示] 模型将在首次评分请求时自动加载")


@app.post("/score", response_model=ScoreResponse)
async def score_image(request: ScoreRequest):
    """对指定图像路径进行美学评分"""
    if not os.path.exists(request.image_path):
        raise HTTPException(status_code=404, detail=f"图像不存在: {request.image_path}")

    try:
        aesthetic_score = predict_aesthetic(request.image_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"评分失败: {str(e)}")

    review = generate_review(aesthetic_score)

    return ScoreResponse(
        aesthetic_score=aesthetic_score,
        score=aesthetic_score,  # 兼容字段
        review=review,
    )


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok", "model": "laion-aesthetics-v2", "device": DEVICE}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
