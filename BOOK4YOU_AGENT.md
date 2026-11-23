# Book4You — Agent Instructions (Report 2: Minimal Design & Implementation + Prototype)

You are my pair-programming agent for **Book4You**, a web platform for booking accommodation. It combines classic search with a bilingual (RO/EN) chatbot that turns free-text requests into editable filters. I'm a student. This is a university project.

Read this whole file before you do anything.

---

## 0. NON-NEGOTIABLE RULES (read first, follow always)

### Rule 1 — Use the Book4You color palette (from the reference repo)
The visual identity comes from my previous project: https://github.com/dghiluta26/Book4You-.NET-Project (`Project/wwwroot/css/style.css`).
Use **exactly** these colors. Do not add new brand colors, and don't use default Tailwind/shadcn colors (blue, slate, zinc and so on) for branded elements.

| Token | Value | Used for |
|---|---|---|
| `primary` (forest green) | `#385144` | Navbar, footer, primary buttons, badges, links, active states, map markers |
| `cream` (background) | `#F8F5F2` | Page background, text/buttons on green surfaces |
| `surface` | `#FFFFFF` | Cards, dropdowns, modals, forms |
| `input` | `#F1F1F1` | Input / select backgrounds |
| `muted-green` | `#E8EDE8` | Chips, soft highlighted areas |
| `warm-gray` | `#F2F0EC` | Secondary panels |
| `text` | `#222222` | Headings / main text |
| `text-body` | `#333333` | Body text |
| `text-muted` | `#666666` | Secondary text (alternates: `#555`, `#5E625F`, `#6A6D6A`) |
| `border` | `#E5E5E5` | Borders / dividers (alternates: `#E6E6E6`, `#D7D7D7`) |
| `danger` | `#8F2424` | Error text |
| `danger-bg` | `rgba(166, 51, 51, 0.10)` + border `rgba(166, 51, 51, 0.22)` | Error boxes |
| `success-bg` | `rgba(56, 81, 68, 0.10)` + border `rgba(56, 81, 68, 0.22)`, text `#385144` | Success boxes |

Hover/soft tints of the primary: `rgba(56,81,68, 0.03 / 0.06 / 0.08 / 0.12)`. Hero overlay: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4))` over a photo.

**Other design traits to keep from the reference repo:**
- Logo: the text "Book4You" in **Poppins** 600, 26px, letter-spacing 1px, cream on green. Load Poppins (400/500/600/700) with `next/font/google` and use it as the main font.
- Navbar: green background, `15px 60px` padding, cream links (hover = opacity 0.7). There's an outlined "Login" button (1px cream border) and a filled "Sign Up" button (cream background, green bold text), both with a 5px radius. A "Hello, {name} ▾" dropdown appears when logged in.
- Footer: green background, cream text, 4-column grid.
- Hero: 90vh, dark overlay on a photo, centered cream text (h1 48px). A cream **search box** floats on it (12px radius, shadow `0 10px 30px rgba(0,0,0,0.25)`) with grey inputs (`#F1F1F1`, 52px tall, 14px radius) and a green "Search" button.
- Accommodation cards: white, **18px radius**, shadow `0 10px 24px rgba(0,0,0,0.08)`. On hover they lift 5px and the shadow becomes `0 14px 32px rgba(0,0,0,0.12)`. The image is 240px tall, `object-fit: cover`. A pill badge with the accommodation type (green at 0.95 opacity, cream text, 999px radius) sits in the top-left corner.
- Buttons: primary = green bg, cream text, bold, 10px radius, hover opacity 0.9. Secondary = 1px green border, green text, hover tint `rgba(56,81,68,0.08)`.
- Radii used: 8, 10, 12, 16, 18 px and 999px for pills. Light, airy, minimalist, content-first.

Put the palette in one place: Tailwind v4 `@theme` tokens in `globals.css`. Map the shadcn/ui CSS variables (`--primary`, `--background`, `--card` and so on) onto these values so every component inherits them.

### Rule 2 — NEVER perform git operations
- **Never** run `git add`, `git commit`, `git push`, `git merge`, `git checkout`, `git branch`, `git rebase`, `git stash`, `git reset`, or anything else that changes repository state. Read-only `git status` / `git diff` / `git log` are fine if they help you.
- I do all git work myself. Your job is to **tell me**, at the right moment:
  - **When to create a new branch** and its exact name.
  - **When to commit**, **which files** to include, and the **exact commit message**.
  - **When to open a Pull Request**: source → target branch, PR title, and a short PR description.
  - When to merge the PR and switch back to `main`/pull.
- Give me the exact commands to copy-paste. Example:
  ```bash
  git checkout -b feature/02-frontend-skeleton
  git add frontend/
  git commit -m "feat(frontend): scaffold Next.js app with Book4You theme"
  git push -u origin feature/02-frontend-skeleton
  ```
- **Branch naming:** `feature/<step-number>-<short-kebab-name>` (e.g. `feature/03-database-schema`). Use `fix/<short-name>` for bug fixes and `docs/<short-name>` for documentation-only changes.
- **Commit messages:** Conventional Commits, in English: `feat(scope): ...`, `fix(scope): ...`, `chore: ...`, `docs: ...`, `test: ...`, `refactor: ...`. Keep commits small and logical (several per step is good).
- **Flow:** one branch per step → commits → PR into `main` → I merge → next step starts from an updated `main`.
- Remind me **never to commit secrets** (`.env`, API keys, Supabase keys). Make sure `.gitignore` covers them, and keep committed `.env.example` files with empty values.

### Rule 3 — Work step by step, and WAIT for my confirmation
- We implement in the numbered steps of section 4. **Never start the next step until I explicitly say it's OK** (e.g. "ok", "next", "confirmed").
- At the end of every step:
  1. Summarize what you did and which files changed.
  2. Tell me **how to run and test it** myself (exact commands + what I should see in the browser or terminal).
  3. Give me the **git instructions** (Rule 2).
  4. Ask: *"Is this step OK? Shall we move to Step N+1?"* Then **stop**.
- If a step is big, split it into sub-steps (e.g. 5a, 5b) and pause after each one too.
- If something is ambiguous (e.g. which LLM provider), **ask me** instead of guessing.
- Don't add features outside the current step's scope, and don't refactor unrelated code without asking.

### Rule 4 — I have nothing installed except Git
Assume a fresh machine. When a step needs a tool, give me the exact install command and a command to verify it worked. Section 3 has the full list. Ask me for my OS (Windows / macOS / Linux) at the very start, if I haven't told you already.

---

## 1. Project summary (from my project proposal)

**Goal.** Reduce the steps needed to find relevant accommodation. The user describes destination, dates, guests, budget and activities in natural language (RO or EN), for example: *"caut o cabană lângă Brașov pentru 4 persoane, în weekendul 14–16 martie, cu un buget de 500 lei pe noapte; vrem să facem drumeții"*. The system extracts structured filters, shows them as **editable** chips/fields, and returns matching stays. The user always keeps control over the filters.

**Actors**
- **Visitor** (not logged in): search and filter, view details and map, use the chatbot.
- **Client** (logged in via Supabase Auth; inherits everything from Visitor): simulated booking, booking history, cancelling, profile.
- **LLM provider** (external system): called **only from the backend**. It only interprets the message into JSON and has **no** database access.

**Functional requirements**
| ID | Requirement |
|---|---|
| CF-01 | Register / login / logout / profile (Supabase Auth, email + password). Booking only for authenticated users. |
| CF-02 | Accommodation catalog + details page (photos, description, capacity, amenities, price/night, location). |
| CF-03 | Search by location, period, guests, price, type. All filters applied together, sortable by price, paginated, only stays available in the period. |
| CF-04 | RO/EN chatbot: extract destination, period, guests, budget, activities → editable filters → results. Asks a clarifying question if essential info is missing (e.g. destination). |
| CF-05 | Map (Leaflet + OpenStreetMap): markers synced with the result list; details page shows the location (+ nearby POIs if available). |
| CF-06 | Availability check, simulated booking, history, cancellation. No overlapping bookings for the same stay. Status: confirmed / cancelled. Cancelling frees the period. |
| CF-07 | Semantic search via embeddings + pgvector (only if time permits). **Out of scope for Report 2.** |

**Non-functional:** responsive (desktop/tablet/mobile), minimalist, RO/EN language switch. Booking takes at most 3 steps from the stay page. Classic search under 1s (indexes on filtered columns). Show a progress indicator while the LLM responds. Validate every request with Pydantic and validate LLM output before turning it into filters. API keys live only on the server, in env variables. Classic search must keep working if the LLM is down.

**Out of MVP:** real payments, sync with external platforms, real-time prices, owner admin panel, native mobile apps.

---

## 2. Scope of THIS phase — Report 2

> **Report 2 – Minimal design and implementation, includes a system prototype** (4 weeks, 20% of final grade)

So we are **not** building the full project. We deliver:
1. **Minimal design:** architecture overview, database schema (ER diagram), main REST endpoints, a sequence diagram for the chatbot flow, and a few screen wireframes. Keep these as Markdown + Mermaid in `/docs` so they can go into the report.
2. **A working prototype** that demonstrates the core flows end to end:
   - classic search with filters + results list + map,
   - accommodation details page,
   - auth (Supabase) + simulated booking with availability check + "My bookings" with cancel,
   - a minimal chatbot that extracts criteria into editable filters (with a fallback when the LLM is unavailable).
3. A small demo catalog (seeded from a small, cleaned subset of Inside Airbnb data, CC BY 4.0, or a hand-made seed of ~30–60 stays if the import is too heavy at first).

Deliberately **left for later** (the final report): CF-07 semantic search / pgvector, full Playwright suite, GitHub Actions CI, Docker Compose for everything, Redis, Stripe test mode, OSM points of interest, polishing. Keep the code structured so these can be added later without rewrites.

---

## 3. Tech stack & environment setup

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript + Tailwind CSS v4 + shadcn/ui, `next-intl` (or a simple dictionary) for RO/EN, Leaflet + react-leaflet + OpenStreetMap tiles |
| Backend | Python 3.13 + FastAPI + Pydantic v2 + SQLAlchemy 2.x + Alembic + Uvicorn |
| Data & auth | Supabase (cloud, free tier): PostgreSQL + Supabase Auth. The backend verifies the Supabase JWT. |
| Chatbot | LLM API with tool/function calling → JSON criteria → Pydantic validation (ask me which provider; I'll get the API key) |
| Testing | Pytest (+ httpx) for the API. Playwright later. |
| Tooling | Git, GitHub, VS Code, Postman (optional) |

### Monorepo layout
```
book4you/
├── frontend/        # Next.js app
├── backend/         # FastAPI app (app/, alembic/, tests/)
├── data/            # import scripts + small cleaned dataset (no huge raw files in git)
├── docs/            # architecture, ER diagram, API, sequence diagrams, wireframes
├── .gitignore
└── README.md        # how to install & run
```

### Installation commands (fresh machine, only Git installed)
**Windows (PowerShell, using winget — built into Windows 10/11):**
```powershell
winget install -e --id OpenJS.NodeJS.LTS          # Node.js LTS + npm
winget install -e --id Python.Python.3.13         # Python 3.13
winget install -e --id Microsoft.VisualStudioCode # VS Code (skip if you have it)
# Close and reopen the terminal, then verify:
node -v
npm -v
python --version
```
*(If `python` opens the Microsoft Store, turn off the "App execution aliases" for python in Windows Settings, or use `py --version`.)*

**macOS (Homebrew):**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node python@3.13
brew install --cask visual-studio-code
node -v && npm -v && python3 --version
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs python3 python3-venv python3-pip
node -v && npm -v && python3 --version
```

**Project-level installs** (the agent gives these at the right step, inside the project folder):
```bash
# Frontend (Step 2)
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd frontend
npx shadcn@latest init
npm install leaflet react-leaflet next-intl @supabase/supabase-js @supabase/ssr
npm install -D @types/leaflet
npm run dev            # → http://localhost:3000

# Backend (Step 3)
cd backend
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1     macOS/Linux: source .venv/bin/activate
pip install fastapi "uvicorn[standard]" pydantic pydantic-settings sqlalchemy alembic "psycopg[binary]" python-dotenv httpx pyjwt pytest
pip freeze > requirements.txt
uvicorn app.main:app --reload   # → http://localhost:8000/docs
```
*(If PowerShell blocks venv activation: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.)*

**Accounts I need to create (no install):** Supabase (https://supabase.com, free project), the LLM provider's API key (Step 8), and optionally Figma for wireframes.
**Optional, later:** Docker Desktop (`winget install -e --id Docker.DockerDesktop`) for Docker Compose.

---

## 4. Implementation steps (pause after EACH one for my confirmation)

| Step | Branch | What |
|---|---|---|
| **0** | — | Ask my OS. Check installs (`node -v`, `python --version`, `git --version`). Help me install anything missing. |
| **1** | `feature/01-project-setup` | Monorepo folders, root `.gitignore` (node_modules, .venv, .env*, .next, __pycache__), `README.md`, `/docs` skeleton. |
| **2** | `feature/02-frontend-skeleton` | Next.js + Tailwind + shadcn/ui, **Book4You theme tokens** (Rule 1), Poppins, layout with navbar + footer, empty Home/Accommodations/Login pages, RO/EN switch. |
| **3** | `feature/03-backend-skeleton` | FastAPI app structure (`app/main.py`, `core/config.py`, `api/`, `models/`, `schemas/`, `services/`), `/health` endpoint, CORS for localhost:3000, `.env.example`, first Pytest. |
| **4** | `feature/04-database-schema` | Supabase project setup (guide me), SQLAlchemy models + Alembic migration: `profiles`, `accommodations`, `accommodation_images`, `amenities`, `accommodation_amenities`, `bookings` (status, check_in, check_out, total_price), with indexes on city, type, price, capacity. ER diagram in `/docs`. |
| **5** | `feature/05-catalog-seed` | Import script: clean a small Inside Airbnb subset (or a seed file) → DB. Drop incomplete records, normalize type/capacity/amenities/coordinates. |
| **6** | `feature/06-search-api-ui` | `GET /accommodations` (filters, sort by price, pagination, availability in period) + `GET /accommodations/{id}`. Frontend: hero with search box, results grid (cards per Rule 1), filter panel, Leaflet map synced with the list, details page. |
| **7** | `feature/07-auth-booking` | Supabase Auth on the frontend (signup/login/logout/profile). Backend verifies the JWT. `POST /bookings` with overlap check, `GET /bookings/me`, `PATCH /bookings/{id}/cancel`. Checkout in ≤3 steps, "My bookings" page. |
| **8** | `feature/08-chatbot-minimal` | `POST /chat/parse`: LLM tool-calling → JSON criteria → Pydantic validation → clarifying question if destination missing. The frontend chat panel shows the criteria as editable filter chips, and the search reruns on edit. Loading indicator. Graceful fallback when the LLM fails. |
| **9** | `docs/09-report2-design` | Finalize `/docs`: architecture diagram, ER diagram, endpoint table, chatbot sequence diagram, screenshots of the prototype, short "how to run" for the report. Basic Pytest coverage for the search and booking endpoints. |

Each step ends with run/test instructions + git instructions + the confirmation question, then **STOP**.

---

## 5. Coding conventions
- TypeScript strict. Use functional React components and server components where it makes sense. Keep components small and reusable (`AccommodationCard`, `FilterPanel`, `SearchBox`, `MapView`, `ChatPanel`).
- Leaflet must be loaded client-side only (`dynamic(..., { ssr: false })`).
- Python: type hints everywhere, Pydantic schemas for every request and response, business logic in `services/`, not in route handlers.
- Booking overlap rule: two bookings overlap if `new.check_in < existing.check_out AND new.check_out > existing.check_in` (only `confirmed` bookings count).
- Secrets only in `.env` / `.env.local`, never in code. The frontend only ever gets the Supabase **anon** key. The LLM key and the Supabase service key stay on the backend.
- UI text goes through the RO/EN dictionaries, with no hard-coded strings in components.
- Explain things briefly as you go. I want to understand the code for my report presentation.
