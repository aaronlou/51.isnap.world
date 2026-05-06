# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Backend (Rust/Axum)
cd backend && cargo run        # Start backend on port 3001
cd backend && cargo build       # Build backend
cd backend && cargo check       # Type-check backend

# Frontend (React/Vite)
cd frontend && npm install      # Install deps
cd frontend && npm run dev      # Start dev server on port 3000
cd frontend && npm run build    # Type-check + build for production
cd frontend && npm run preview  # Preview production build
```

No test or lint frameworks are configured yet.

## Architecture (DDD — four layers)

### Monorepo structure

```
├── backend/
│   └── src/
│       ├── main.rs                  # Composition root (DI container)
│       ├── domain/                  # Domain layer — no external deps
│       │   ├── photo.rs             # Entity (Photo) + Value Object (PhotoId)
│       │   ├── score.rs             # Value Object (Score) — validation + normalization
│       │   ├── file.rs              # Value Object (FileUpload) — file validation
│       │   ├── scoring.rs           # Domain Service (ScoringCoordinator) + Port (ScoringEngine)
│       │   ├── repository.rs        # Ports (PhotoRepository, FileStorage)
│       │   └── errors.rs            # DomainError enum
│       ├── application/             # Application layer — use cases + DTOs
│       │   ├── dto.rs               # PhotoDto, ScoreResultDto
│       │   └── use_cases/
│       │       ├── upload_photo.rs
│       │       ├── score_photo.rs
│       │       ├── list_photos.rs
│       │       └── get_leaderboard.rs
│       ├── infrastructure/          # Infrastructure — implements domain ports
│       │   ├── db/sqlite.rs         # PhotoRepository impl (rusqlite)
│       │   ├── http/
│       │   │   ├── gemini_client.rs # ScoringEngine impl + ACL
│       │   │   └── artimuse_client.rs # ScoringEngine impl + ACL
│       │   └── storage/
│       │       └── local_file_storage.rs # FileStorage impl
│       └── presentation/            # HTTP layer (Axum handlers)
│           ├── error.rs             # ApiError — DomainError → HTTP response mapping
│           └── routes/
│               ├── photos.rs
│               ├── leaderboard.rs
│               └── health.rs
├── frontend/         # React SPA (Vite + TypeScript + Tailwind + Framer Motion)
│   └── src/
│       ├── App.tsx
│       ├── api/
│       ├── hooks/
│       ├── components/
│       │   ├── UploadZone.tsx
│       │   ├── ScoreReveal.tsx
│       │   ├── Leaderboard.tsx
│       │   └── PhotoGallery.tsx
│       └── types/
└── .env
```

### API endpoints

| Method | Path                     | Handler              |
|--------|--------------------------|----------------------|
| GET    | `/api/health`            | health_check         |
| POST   | `/api/upload`            | upload_photo         |
| GET    | `/api/photos`            | list_photos          |
| POST   | `/api/photos/:id/score`  | score_photo          |
| GET    | `/api/leaderboard`       | get_leaderboard      |
| GET    | `/uploads/*`             | static file serve    |

### DDD layer rules

- **Domain** — pure business logic, no framework imports. Entities have behavior (e.g. `Photo::assign_score`). Value objects self-validate (e.g. `Score::new` clamps/clamps and rejects NaN).
- **Application** — orchestrates domain + ports via use cases. Each use case is a struct with a single `execute()` method. Depends on interfaces (ports), not concrete implementations. Transforms domain entities to DTOs.
- **Infrastructure** — implements ports defined in domain (PhotoRepository, FileStorage, ScoringEngine). Anti-corruption layer in HTTP clients translates external schemas to domain types.
- **Presentation** — thin Axum handlers that extract request data and call use cases. ApiError maps DomainError variants to HTTP status codes.

### Scoring engine chain

`ScoringCoordinator` (domain service) manages a prioritized list of `ScoringEngine` instances. Priority: **ArtiMuse > Gemini > simulated fallback** (3.5). Add new engines by implementing `ScoringEngine` in `infrastructure/http/` and registering in `main.rs`.

### Dependency injection

All dependencies are wired in `main.rs` (composition root). Use cases receive their dependencies through constructor injection. The `AppState` struct acts as a DI container, holding all use case instances.

### Environment variables (`.env`)

- `GEMINI_API_KEY` — Google Gemini 2.0 Pro API key
- `ARTIMUSE_ENABLED` — set `true` to use local ArtiMuse engine
- `ARTIMUSE_URL` — defaults to `http://127.0.0.1:8000`
- `BACKEND_PORT`, `FRONTEND_PORT` — port config
