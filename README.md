# Book4You

Web platform for booking accommodation. It combines classic search with a bilingual (RO/EN) assistant
that turns free-text requests into editable filters. University project (Report 2: minimal design and
prototype).

**Features:** search with filters, price sorting and availability; results synced with a map; details
page; Supabase accounts; 3-step simulated booking with cancellation; RO/EN assistant with a fallback.

Documentation: [docs/](docs/README.md).

## Repository layout

```
book4you/
├── frontend/   # Next.js app (App Router, TypeScript, Tailwind v4)
├── backend/    # FastAPI app (app/, alembic/, tests/)
├── data/       # demo catalog and import script
└── docs/       # architecture, database, API, diagrams, wireframes, screenshots, testing
```

## Requirements (Linux and Windows)

| Tool | Version | Check |
|---|---|---|
| Git | any recent | `git --version` |
| Node.js | LTS or newer | `node -v` / `npm -v` |
| uv | any recent | `uv --version` |
| Python | 3.13 (installed with uv) | `uv python list --only-installed` |
| Docker | optional, only for database tests | `docker --version` |

```bash
# Linux / macOS
curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows (PowerShell)
winget install -e --id astral-sh.uv

uv python install 3.13
```

## Accounts and keys

1. A free [Supabase](https://supabase.com) project ([setup steps](docs/database.md#supabase-setup-once-per-project)).
   Turn off **Confirm email** (Authentication > Sign In / Providers) for the demo, because the
   built-in email service is heavily rate-limited.
2. Optional: a [Gemini API key](https://aistudio.google.com/apikey) for the assistant. Without it,
   simple keyword rules are used.

| File | Variable | Secret? |
|---|---|---|
| `backend/.env` | `DATABASE_URL` (Supabase session pooler URI) | **yes** |
| `backend/.env` | `SUPABASE_URL` | no |
| `backend/.env` | `LLM_API_KEY` | **yes** |
| `frontend/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | no |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) | no |

Never commit `.env` files. Copy them from the `.env.example` files on each computer.

## First-time setup

```bash
# backend
cd backend
uv venv --python 3.13 .venv
source .venv/bin/activate            # Windows: .venv\Scripts\Activate.ps1
uv pip install -r requirements.txt
cp .env.example .env                 # Windows: copy .env.example .env     then fill it in

# database (only once per Supabase project)
alembic upgrade head
python ../data/import_catalog.py     # 50 demo stays; safe to run again

# frontend
cd ../frontend
npm install
cp .env.example .env.local           # Windows: copy .env.example .env.local   then fill it in
```

## Running

Two terminals:

```bash
# 1. API: http://localhost:8000/docs
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload
# 2. Web app: http://localhost:3000
cd frontend && npm run dev
```

Restart a server after editing its environment file.

## Tests

```bash
cd backend && source .venv/bin/activate && pytest
cd frontend && npm run lint && npm run build
```

Database tests and coverage: see [docs/testing.md](docs/testing.md).

## Working on several computers

- Pull before you start and push when you stop.
- Both computers use the same cloud database, so migrations and the import run only once.
- Environment files are not in git: create them on each computer.

## Data

The demo catalog ([data/catalog_seed.json](data/catalog_seed.json)) is hand-curated: fictional
listings in real Romanian locations, with placeholder photos from [picsum.photos](https://picsum.photos).
Map data © OpenStreetMap contributors.
