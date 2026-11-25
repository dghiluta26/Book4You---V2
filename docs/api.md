# REST API

Interactive docs (Swagger UI) at <http://localhost:8000/docs> when the backend runs.

| Method | Path | Auth | Purpose | Step |
|---|---|---|---|---|
| GET | `/health` | no | Liveness check | 3 |
| GET | `/accommodations` | no | Search with filters, sort, pagination, availability | 6 |
| GET | `/accommodations/{id}` | no | Details: photos, description, amenities, location | 6 |
| GET | `/accommodations/{id}/availability` | no | Is the stay free for a period? Nights and total price | 7 |
| POST | `/bookings` | yes | Create a booking (overlap check) | 7 |
| GET | `/bookings/me` | yes | My bookings | 7 |
| PATCH | `/bookings/{id}/cancel` | yes | Cancel a booking | 7 |
| POST | `/chat/parse` | no | Free text (RO/EN) to editable filters | 8 |

## GET /accommodations

All parameters are optional and are combined with AND.

| Parameter | Type | Meaning |
|---|---|---|
| `city` | text | Partial, case- and accent-insensitive (`brasov` finds Brașov and Poiana Brașov) |
| `check_in`, `check_out` | date (`YYYY-MM-DD`) | Only stays with no confirmed booking overlapping the period. Must be sent together, `check_out > check_in` |
| `guests` | int 1-20 | Stays with `capacity >= guests` |
| `min_price`, `max_price` | number | Price per night range |
| `type` | repeatable | `apartment`, `house`, `cabin`, `villa`, `hotel`, `hostel`, `room` |
| `sort` | `price_asc` (default) / `price_desc` | |
| `page`, `page_size` | int | Default 1 and 12; `page_size` max 50 |

Response: `{ items: [...], total, page, page_size, total_pages }`. Each item has what a card and a
map marker need (`id`, `title`, `type`, `city`, `latitude`, `longitude`, `price_per_night`,
`capacity`, `thumbnail`, ...). Invalid input returns **422**.

Example: `GET /accommodations?city=brasov&type=cabin&guests=4&max_price=600&check_in=2026-12-04&check_out=2026-12-08`

## GET /accommodations/{id}

Same fields as a list item plus `description`, `address`, `images` (ordered) and `amenities`
(`slug`, `name_en`, `name_ro`). Unknown id returns **404**.

## Authentication

Login is handled by Supabase Auth in the browser. The frontend sends the Supabase access token to
the API as `Authorization: Bearer <token>`. The backend verifies it with the project's **public**
keys (JWKS, ES256): signature, issuer, audience and expiry. No secret is stored on the backend and
passwords never reach it. Protected endpoints answer **401** for a missing, invalid or expired token.
The user's profile row is created automatically the first time they book.

## GET /accommodations/{id}/availability

Parameters: `check_in`, `check_out` (both required). Response:
`{ available, nights, total_price, currency, reason }` where `reason` is `null`, `"booked"` or `"past"`.

## Bookings

| Endpoint | Success | Errors |
|---|---|---|
| `POST /bookings` body `{accommodation_id, check_in, check_out, guests}` | **201** the booking | 401 not logged in, 404 unknown stay, **409** dates already booked, 422 rule violation (past check-in, more guests than capacity, longer than 30 nights, `check_out <= check_in`) |
| `GET /bookings/me` | 200 list, newest stay first (each with the stay summary) | 401 |
| `PATCH /bookings/{id}/cancel` | 200 the cancelled booking | 401, 404 (missing or not yours), 409 already cancelled |

Rules: two bookings overlap if `new.check_in < existing.check_out AND new.check_out > existing.check_in`.
Only `confirmed` bookings count, so cancelling frees the period, and a stay may start on the day the
previous one ends. The check runs in the service layer (friendly 409) and again in the database
(`EXCLUDE` constraint), so two simultaneous requests cannot double-book. `total_price = nights x price_per_night`.

## POST /chat/parse

Turns a free-text request (Romanian or English) into editable search filters. No login needed.

Request:

```json
{ "message": "caut o cabană lângă Brașov pentru 4 persoane", "locale": "ro", "previous": null }
```

`message`: 1-500 characters. `previous`: the filters currently shown, so a follow-up message
("Brașov", "mai ieftin") refines them.

Response:

```json
{
  "criteria": { "destination": "Brașov", "check_in": null, "check_out": null, "guests": 4,
                "min_price": null, "max_price": null, "types": ["cabin"], "activities": [] },
  "missing": [],
  "clarification": null,
  "language": "ro",
  "source": "llm",
  "warnings": []
}
```

- `missing: ["destination"]` comes with a `clarification` question in the user's language.
- `source: "fallback"`: the language model was not available, simple keyword rules were used
  (`warnings` contains `llm_unavailable` if a configured model failed). The endpoint still answers 200.
- `warnings: ["dates_ignored"]`: dates were past, reversed or incomplete.
- `activities` are shown to the user but do not filter the classic search.
- Invalid input returns **422**.

### How the language model is used safely

Google Gemini (Interactions API) is forced to call one function, `set_search_filters`. It has no
database access and nothing is executed on its behalf: the backend only reads the arguments and
validates every field with Pydantic, dropping invalid values. Requests are sent with `store: false`.
The API key exists only on the backend.
