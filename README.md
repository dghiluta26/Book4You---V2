# Book4You

Web platform for booking accommodation. It combines classic search with a bilingual (RO/EN) chatbot that turns free-text requests into editable filters. University project (Report 2: minimal design + prototype).

## Repository layout

```
book4you/
├── frontend/   # Next.js app (App Router, TypeScript, Tailwind v4, shadcn/ui)
├── backend/    # FastAPI app (app/, alembic/, tests/)
├── data/       # import scripts + small cleaned dataset
├── docs/       # architecture, ER diagram, API, sequence diagrams, wireframes
├── .gitignore
└── README.md
```

## Requirements (Linux and Windows)

| Tool | Version | Check |
|---|---|---|
| Git | any recent | `git --version` |
| Node.js | LTS (20+) | `node -v` / `npm -v` |
| Python | **3.13** (via `uv`) | `uv python list --only-installed` |
| uv | any recent | `uv --version` |

Install `uv` and Python 3.13:

```bash
# Linux / macOS
curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows (PowerShell)
winget install -e --id astral-sh.uv

uv python install 3.13
```

## Running the project

Instructions are added step by step as the project grows.

- Frontend (Next.js):
  ```bash
  cd frontend
  npm install      # first time on each machine
  cp .env.example .env.local   # then fill in the Supabase URL and publishable key. Windows: copy
  npm run dev      # http://localhost:3000
  ```
- Backend (FastAPI), first time on each machine:
  ```bash
  cd backend
  uv venv --python 3.13 .venv
  # Linux/macOS:  source .venv/bin/activate
  # Windows:      .venv\Scripts\Activate.ps1
  uv pip install -r requirements.txt
  cp .env.example .env        # Windows: copy .env.example .env
  ```
  Run and test:
  ```bash
  uvicorn app.main:app --reload   # http://localhost:8000/docs
  pytest
  ```
  The search tests need a throwaway PostgreSQL and are skipped without one (see `backend/tests/conftest.py`).
  With Docker:
  ```bash
  docker run --rm -d --name b4y-test-pg -p 54329:5432 -e POSTGRES_PASSWORD=test postgres:17
  TEST_DATABASE_URL=postgresql://postgres:test@localhost:54329/postgres pytest   # PowerShell: $env:TEST_DATABASE_URL="..."
  docker stop b4y-test-pg
  ```

### Demo catalog

50 curated stays in 18 Romanian locations (`data/catalog_seed.json`). After `alembic upgrade head`:

```bash
cd backend && source .venv/bin/activate     # Windows: .venv\Scripts\Activate.ps1
python ../data/import_catalog.py --dry-run  # validate only
python ../data/import_catalog.py            # import (safe to run again: it updates, not duplicates)
```

### Login (Supabase Auth)

- `frontend/.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (both public)
- `backend/.env`: `SUPABASE_URL` (no secret needed; tokens are verified with the project's public keys)
- Restart both servers after changing these files.
- For the demo, turn off **Confirm email** in Supabase (Authentication > Sign In / Providers > Email),
  because the built-in email service is heavily rate-limited.

## Working on several computers

- `git pull` before you start, `git push` when you stop.
- Secrets are never committed. On each machine, copy `.env.example` to `.env` (backend) or `.env.local` (frontend) and fill in your own values.

## Docs

See [docs/](docs/README.md).

## Data attribution

The demo catalog is derived from [Inside Airbnb](http://insideairbnb.com/get-the-data/) data (CC BY 4.0).
