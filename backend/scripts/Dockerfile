FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libgomp1 \
        && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY scripts/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scripts/volcengine_aesthetic_server.py .

EXPOSE 8001

ENV VOLCENGINE_PORT=8001
ENV VOLCENGINE_DEVICE=cpu

CMD ["python", "volcengine_aesthetic_server.py"]
