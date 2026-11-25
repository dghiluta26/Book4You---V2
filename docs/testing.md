# Testing

## Automated tests (backend)

105 Pytest tests, 94% statement coverage of `backend/app` (measured 25 November 2026).

| File | Tests | What it covers | Needs PostgreSQL |
|---|---|---|---|
| `test_accommodations_api.py` | 16 | filters, sorting, pagination, availability, details, validation | yes |
| `test_bookings_api.py` | 18 | availability, booking rules, overlap, race protection, history, cancel | yes |
| `test_security.py` | 11 | token verification: expired, wrong issuer or audience, forged, wrong algorithm | no |
| `test_chat_api.py` | 14 | assistant endpoint with a fake model, fallback, validation | no |
| `test_chat_gemini.py` | 14 | Gemini request and every failure mode, with a fake server | no |
| `test_chat_service.py` | 16 | validation, merging, RO/EN fallback rules | no |
| `test_catalog_import.py` | 9 | data cleaning rules, committed seed file | no |
| `test_models.py` | 4 | schema and indexes | no |
| `test_health.py` | 3 | health endpoint and CORS | no |

Without a test database, 71 tests run and 34 are skipped.

```bash
cd backend && source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
pytest                                          # without database tests

docker run --rm -d --name b4y-test-pg -p 54329:5432 -e POSTGRES_PASSWORD=test postgres:17
TEST_DATABASE_URL=postgresql://postgres:test@localhost:54329/postgres pytest --cov=app
docker stop b4y-test-pg
# PowerShell: $env:TEST_DATABASE_URL="postgresql://postgres:test@localhost:54329/postgres"; pytest --cov=app
```

Never point `TEST_DATABASE_URL` at the Supabase database: the tests drop and recreate the tables.

## Search performance

`GET /accommodations` against the Supabase database (EU), from the development machine, 10 requests
per case on 25 November 2026, 50 stays:

| Case | Results | Median | Max |
|---|---|---|---|
| no filters | 50 | 157 ms | 158 ms |
| city, guests, price | 5 | 158 ms | 163 ms |
| all filters with dates | 1 | 160 ms | 173 ms |

## Frontend checks

The frontend passes ESLint, the TypeScript check and the production build. The main flows (search,
map, assistant, login, booking, cancellation) were checked in a browser during development, partly
with temporary scripts and a stand-in authentication server. These checks are **not** an automated
test suite in the repository; Playwright tests are planned for the final report.

```bash
cd frontend && npm run lint && npm run build
```
