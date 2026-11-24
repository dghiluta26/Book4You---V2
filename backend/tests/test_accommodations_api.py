"""Tests of GET /accommodations and GET /accommodations/{id} (need TEST_DATABASE_URL)."""

from datetime import date

from fastapi.testclient import TestClient


def titles(response) -> list[str]:
    return [item["title"] for item in response.json()["items"]]


def test_lists_all_sorted_by_price_ascending_by_default(client: TestClient, catalog) -> None:
    response = client.get("/accommodations")
    assert response.status_code == 200
    assert [i["price_per_night"] for i in response.json()["items"]] == [200, 350, 450, 900]
    assert response.json()["total"] == 4


def test_sort_by_price_descending(client: TestClient, catalog) -> None:
    response = client.get("/accommodations", params={"sort": "price_desc"})
    assert [i["price_per_night"] for i in response.json()["items"]] == [900, 450, 350, 200]


def test_city_filter_is_partial_and_accent_insensitive(client: TestClient, catalog) -> None:
    for query in ("brasov", "Brașov", "BRAŞOV", "  brasov "):
        response = client.get("/accommodations", params={"city": query})
        assert sorted(titles(response)) == ["Cabin in Brașov", "Hotel Poiana Brașov"], query


def test_city_wildcards_are_not_interpreted(client: TestClient, catalog) -> None:
    assert client.get("/accommodations", params={"city": "%"}).json()["total"] == 0
    assert client.get("/accommodations", params={"city": "_"}).json()["total"] == 0


def test_guests_filter_uses_capacity(client: TestClient, catalog) -> None:
    response = client.get("/accommodations", params={"guests": 5})
    assert sorted(titles(response)) == ["Cabin in Brașov", "Villa in Mamaia"]


def test_price_range(client: TestClient, catalog) -> None:
    response = client.get("/accommodations", params={"min_price": 300, "max_price": 450})
    assert titles(response) == ["Hotel Poiana Brașov", "Cabin in Brașov"]


def test_type_filter_accepts_several_values(client: TestClient, catalog) -> None:
    response = client.get("/accommodations", params=[("type", "cabin"), ("type", "villa")])
    assert sorted(titles(response)) == ["Cabin in Brașov", "Villa in Mamaia"]


def test_all_filters_are_applied_together(client: TestClient, catalog) -> None:
    response = client.get(
        "/accommodations",
        params={"city": "brasov", "type": "cabin", "guests": 4, "max_price": 500},
    )
    assert titles(response) == ["Cabin in Brașov"]
    response = client.get("/accommodations", params={"city": "brasov", "type": "cabin", "max_price": 400})
    assert titles(response) == []


def test_pagination(client: TestClient, catalog) -> None:
    first = client.get("/accommodations", params={"page_size": 3}).json()
    second = client.get("/accommodations", params={"page_size": 3, "page": 2}).json()
    assert (first["total"], first["total_pages"], len(first["items"])) == (4, 2, 3)
    assert len(second["items"]) == 1
    assert client.get("/accommodations", params={"page": 99}).json()["items"] == []


def test_thumbnail_is_the_first_image(client: TestClient, catalog) -> None:
    items = client.get("/accommodations", params={"type": "cabin"}).json()["items"]
    assert items[0]["thumbnail"] == "http://x/1.jpg"


def test_booked_stays_are_excluded_in_the_period(client: TestClient, catalog, make_booking) -> None:
    make_booking(catalog["cabin"], date(2026, 12, 1), date(2026, 12, 5))
    search = {"check_in": "2026-12-04", "check_out": "2026-12-08"}
    assert "Cabin in Brașov" not in titles(client.get("/accommodations", params=search))
    # a different period is fine
    later = {"check_in": "2026-12-10", "check_out": "2026-12-12"}
    assert "Cabin in Brașov" in titles(client.get("/accommodations", params=later))


def test_checkout_day_is_free_for_a_new_check_in(client: TestClient, catalog, make_booking) -> None:
    make_booking(catalog["cabin"], date(2026, 12, 1), date(2026, 12, 5))
    params = {"check_in": "2026-12-05", "check_out": "2026-12-07"}
    assert "Cabin in Brașov" in titles(client.get("/accommodations", params=params))


def test_cancelled_bookings_free_the_period(client: TestClient, catalog, make_booking) -> None:
    make_booking(catalog["cabin"], date(2026, 12, 1), date(2026, 12, 5), status="cancelled")
    params = {"check_in": "2026-12-02", "check_out": "2026-12-04"}
    assert "Cabin in Brașov" in titles(client.get("/accommodations", params=params))


def test_invalid_parameters_return_422(client: TestClient, catalog) -> None:
    bad_requests = [
        {"check_in": "2026-12-10"},                                  # only one date
        {"check_in": "2026-12-10", "check_out": "2026-12-05"},       # reversed dates
        {"min_price": 500, "max_price": 100},
        {"type": "castle"},
        {"guests": 0},
        {"page_size": 1000},
    ]
    for params in bad_requests:
        assert client.get("/accommodations", params=params).status_code == 422, params


def test_detail_returns_images_in_order_and_amenities(client: TestClient, catalog) -> None:
    response = client.get(f"/accommodations/{catalog['cabin'].id}")
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Cabin in Brașov"
    assert [i["url"] for i in body["images"]] == ["http://x/1.jpg", "http://x/2.jpg"]
    assert body["amenities"][0]["slug"] == "wifi"


def test_detail_of_unknown_id_is_404(client: TestClient, catalog) -> None:
    assert client.get("/accommodations/999999").status_code == 404
