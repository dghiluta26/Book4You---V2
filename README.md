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
  npm run dev      # http://localhost:3000
  ```
- Backend: see `backend/` (Step 3)

## Working on several computers

- `git pull` before you start, `git push` when you stop.
- Secrets are never committed. On each machine, copy `.env.example` to `.env` (backend) or `.env.local` (frontend) and fill in your own values.

## Docs

See [docs/](docs/README.md).

## Data attribution

The demo catalog is derived from [Inside Airbnb](http://insideairbnb.com/get-the-data/) data (CC BY 4.0).
