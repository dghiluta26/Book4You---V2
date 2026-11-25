"""Booking endpoints (need TEST_DATABASE_URL, see conftest.py)."""

import uuid
from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.core.security import AuthUser, get_current_user
from app.main import app

TODAY = date.today()


def d(days: int) -> str:
    return (TODAY + timedelta(days=days)).isoformat()


def book(client: TestClient, stay, start: int, end: int, guests: int = 2):
    return client.post(
        "/bookings",
        json={"accommodation_id": stay.id, "check_in": d(start), "check_out": d(end), "guests": guests},
    )


def login_as(user: AuthUser) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


# ---------- availability ----------

def test_availability_reports_nights_and_total(client: TestClient, catalog) -> None:
    response = client.get(
        f"/accommodations/{catalog['cabin'].id}/availability",
        params={"check_in": d(10), "check_out": d(13)},
    )
    assert response.status_code == 200
    assert response.json() == {
        "available": True, "nights": 3, "total_price": 1350.0, "currency": "RON", "reason": None,
    }


def test_availability_false_when_booked(client: TestClient, catalog, current_user) -> None:
    assert book(client, catalog["cabin"], 10, 14).status_code == 201
    response = client.get(
        f"/accommodations/{catalog['cabin'].id}/availability",
        params={"check_in": d(12), "check_out": d(15)},
    )
    assert response.json()["available"] is False and response.json()["reason"] == "booked"


def test_availability_false_in_the_past(client: TestClient, catalog) -> None:
    response = client.get(
        f"/accommodations/{catalog['cabin'].id}/availability",
        params={"check_in": d(-5), "check_out": d(-3)},
    )
    assert response.json()["reason"] == "past"


def test_availability_errors(client: TestClient, catalog) -> None:
    stay = catalog["cabin"].id
    assert client.get("/accommodations/999999/availability",
                      params={"check_in": d(1), "check_out": d(2)}).status_code == 404
    assert client.get(f"/accommodations/{stay}/availability",
                      params={"check_in": d(5), "check_out": d(2)}).status_code == 422
    assert client.get(f"/accommodations/{stay}/availability").status_code == 422


# ---------- create ----------

def test_booking_requires_login(client: TestClient, catalog) -> None:
    assert book(client, catalog["cabin"], 10, 12).status_code in (401, 503)


def test_create_booking(client: TestClient, catalog, current_user) -> None:
    response = book(client, catalog["cabin"], 10, 13, guests=4)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "confirmed" and body["nights"] == 3
    assert body["total_price"] == 1350.0 and body["guests"] == 4
    assert body["accommodation"]["title"] == "Cabin in Brașov"


def test_overlapping_booking_is_rejected(client: TestClient, catalog, current_user) -> None:
    assert book(client, catalog["cabin"], 10, 14).status_code == 201
    for start, end in [(12, 16), (8, 11), (10, 14), (11, 12), (5, 20)]:
        assert book(client, catalog["cabin"], start, end).status_code == 409, (start, end)


def test_back_to_back_bookings_are_allowed(client: TestClient, catalog, current_user) -> None:
    assert book(client, catalog["cabin"], 10, 14).status_code == 201
    assert book(client, catalog["cabin"], 14, 16).status_code == 201   # starts on checkout day
    assert book(client, catalog["cabin"], 8, 10).status_code == 201    # ends on check-in day


def test_other_stays_are_not_affected(client: TestClient, catalog, current_user) -> None:
    assert book(client, catalog["cabin"], 10, 14).status_code == 201
    assert book(client, catalog["hotel"], 10, 14).status_code == 201


def test_two_different_users_cannot_double_book(client: TestClient, catalog) -> None:
    login_as(AuthUser(id=uuid.uuid4(), email="a@x.dev"))
    assert book(client, catalog["cabin"], 10, 14).status_code == 201
    login_as(AuthUser(id=uuid.uuid4(), email="b@x.dev"))
    assert book(client, catalog["cabin"], 11, 13).status_code == 409


def test_business_rules_return_422(client: TestClient, catalog, current_user) -> None:
    cabin = catalog["cabin"]  # capacity 6
    assert book(client, cabin, 10, 12, guests=7).status_code == 422      # too many guests
    assert book(client, cabin, -3, 2).status_code == 422                 # check-in in the past
    assert book(client, cabin, 10, 50).status_code == 422                # longer than 30 nights
    assert book(client, cabin, 12, 10).status_code == 422                # reversed dates
    assert book(client, cabin, 10, 12, guests=0).status_code == 422


def test_booking_unknown_stay_is_404(client: TestClient, current_user) -> None:
    response = client.post(
        "/bookings",
        json={"accommodation_id": 999999, "check_in": d(10), "check_out": d(12), "guests": 2},
    )
    assert response.status_code == 404


# ---------- history and cancel ----------

def test_my_bookings_lists_only_mine_newest_first(client: TestClient, catalog) -> None:
    ana = AuthUser(id=uuid.uuid4(), email="ana@x.dev")
    bob = AuthUser(id=uuid.uuid4(), email="bob@x.dev")
    login_as(ana)
    book(client, catalog["cabin"], 10, 12)
    book(client, catalog["hotel"], 30, 32)
    login_as(bob)
    book(client, catalog["apartment"], 10, 11)

    login_as(ana)
    mine = client.get("/bookings/me").json()
    assert [b["accommodation"]["title"] for b in mine] == ["Hotel Poiana Brașov", "Cabin in Brașov"]
    login_as(bob)
    assert len(client.get("/bookings/me").json()) == 1


def test_cancel_frees_the_period(client: TestClient, catalog, current_user) -> None:
    booking_id = book(client, catalog["cabin"], 10, 14).json()["id"]
    search = {"check_in": d(11), "check_out": d(13)}
    assert book(client, catalog["cabin"], 11, 13).status_code == 409
    assert "Cabin in Brașov" not in [i["title"] for i in client.get("/accommodations", params=search).json()["items"]]

    response = client.patch(f"/bookings/{booking_id}/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled" and response.json()["cancelled_at"]

    assert "Cabin in Brașov" in [i["title"] for i in client.get("/accommodations", params=search).json()["items"]]
    assert book(client, catalog["cabin"], 11, 13).status_code == 201   # free again


def test_database_constraint_catches_a_simultaneous_double_booking(
    client: TestClient, catalog, current_user, monkeypatch
) -> None:
    """Two requests can both pass the Python check at the same moment. The database refuses the
    second one (EXCLUDE constraint) and the API answers 409 instead of crashing."""
    from app.services import booking_service

    assert book(client, catalog["cabin"], 10, 14).status_code == 201
    monkeypatch.setattr(booking_service, "_is_booked", lambda *args, **kwargs: False)  # simulate the race
    assert book(client, catalog["cabin"], 11, 13).status_code == 409
    # the session is still healthy afterwards
    assert len(client.get("/bookings/me").json()) == 1


def test_cancel_twice_is_409(client: TestClient, catalog, current_user) -> None:
    booking_id = book(client, catalog["cabin"], 10, 14).json()["id"]
    assert client.patch(f"/bookings/{booking_id}/cancel").status_code == 200
    assert client.patch(f"/bookings/{booking_id}/cancel").status_code == 409


def test_cannot_cancel_someone_elses_booking(client: TestClient, catalog) -> None:
    login_as(AuthUser(id=uuid.uuid4(), email="owner@x.dev"))
    booking_id = book(client, catalog["cabin"], 10, 14).json()["id"]
    login_as(AuthUser(id=uuid.uuid4(), email="intruder@x.dev"))
    assert client.patch(f"/bookings/{booking_id}/cancel").status_code == 404
    login_as(AuthUser(id=uuid.uuid4(), email="owner2@x.dev"))
    assert client.patch("/bookings/999999/cancel").status_code == 404


def test_profile_follows_the_account_name(client: TestClient, catalog, db) -> None:
    from app.models import Profile

    user_id = uuid.uuid4()
    login_as(AuthUser(id=user_id, email="ana@x.dev", full_name="Ana"))
    book(client, catalog["cabin"], 10, 12)
    login_as(AuthUser(id=user_id, email="ana@x.dev", full_name="Ana Pop"))
    book(client, catalog["cabin"], 20, 22)

    db.expire_all()
    assert db.get(Profile, user_id).full_name == "Ana Pop"
