# =====================
# Build stage
# =====================
FROM rust:1.86-slim AS builder

RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN --mount=type=cache,target=/app/target \
    --mount=type=cache,target=/usr/local/cargo/registry \
    cargo build --release && \
    cp /app/target/release/photo-battle-backend /app/photo-battle-backend

# =====================
# Runtime stage
# =====================
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/photo-battle-backend .

RUN mkdir -p uploads

EXPOSE 3001

CMD ["./photo-battle-backend"]
