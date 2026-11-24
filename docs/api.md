# REST API

Interactive docs (Swagger UI) at <http://localhost:8000/docs> when the backend runs.

| Method | Path | Auth | Purpose | Step |
|---|---|---|---|---|
| GET | `/health` | no | Liveness check | 3 |
| GET | `/accommodations` | no | Search with filters, sort, pagination, availability | 6 |
| GET | `/accommodations/{id}` | no | Details: photos, description, amenities, location | 6 |
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
