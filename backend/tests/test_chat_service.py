"""Validation, merging and fallback rules of the chatbot (no network, no database)."""

from datetime import date

import pytest

from app.schemas.chat import SearchCriteria
from app.services.chat.criteria import merge, sanitize
from app.services.chat.fallback import detect_language, extract_with_rules

TODAY = date(2026, 11, 25)
CITIES = ["Brașov", "Poiana Brașov", "Bran", "București", "Sibiu", "Cluj-Napoca", "Mamaia"]


def rules(message: str, locale: str = "ro") -> SearchCriteria:
    return sanitize(extract_with_rules(message, CITIES, TODAY, locale), TODAY)[0]


# ---------- sanitize: the model's answer is untrusted ----------

def test_valid_values_are_kept() -> None:
    criteria, ignored = sanitize(
        {"destination": " Brașov ", "check_in": "2027-03-14", "check_out": "2027-03-16",
         "guests": 4, "max_price": 500, "types": ["cabin"], "activities": ["drumeții"]},
        TODAY,
    )
    assert criteria.destination == "Brașov" and criteria.guests == 4 and not ignored
    assert criteria.check_in == date(2027, 3, 14) and criteria.max_price == 500


@pytest.mark.parametrize(
    "dates",
    [
        {"check_in": "2026-03-14", "check_out": "2026-03-16"},  # past
        {"check_in": "2027-03-16", "check_out": "2027-03-14"},  # reversed
        {"check_in": "2027-03-14"},                              # incomplete
        {"check_in": "next friday", "check_out": "2027-03-16"},  # not a date
    ],
)
def test_unusable_dates_are_ignored_but_the_rest_is_kept(dates) -> None:
    criteria, ignored = sanitize({"destination": "Sibiu", **dates}, TODAY)
    assert ignored and criteria.check_in is None and criteria.check_out is None
    assert criteria.destination == "Sibiu"


def test_bad_values_are_dropped() -> None:
    criteria, _ = sanitize(
        {"destination": 42, "guests": 999, "max_price": -5, "min_price": "cheap",
         "types": ["castle", "Cabin", "cabin"], "activities": [1, "x", "ski", "ski"],
         "delete_all_bookings": True},
        TODAY,
    )
    assert criteria.destination is None and criteria.guests is None
    assert criteria.max_price is None and criteria.min_price is None
    assert criteria.types == ["cabin"] and criteria.activities == ["ski"]


def test_wrong_container_types_do_not_crash() -> None:
    criteria, _ = sanitize({"types": "cabin", "activities": None, "guests": True}, TODAY)
    assert criteria == SearchCriteria()


# ---------- merge: follow-up messages refine the filters ----------

def test_merge_keeps_what_was_not_mentioned() -> None:
    previous = SearchCriteria(guests=4, types=["cabin"], max_price=500)
    merged = merge(previous, SearchCriteria(destination="Brașov"))
    assert merged.destination == "Brașov" and merged.guests == 4
    assert merged.types == ["cabin"] and merged.max_price == 500


def test_merge_new_values_win_and_budget_stays_consistent() -> None:
    merged = merge(SearchCriteria(min_price=400, max_price=600), SearchCriteria(max_price=300))
    assert merged.max_price == 300 and merged.min_price is None


# ---------- fallback rules ----------

def test_the_proposal_example_in_romanian() -> None:
    criteria = rules(
        "caut o cabană lângă Brașov pentru 4 persoane, în weekendul 14–16 martie, "
        "cu un buget de 500 lei pe noapte; vrem să facem drumeții"
    )
    assert criteria.destination == "Brașov" and criteria.guests == 4
    assert (criteria.check_in, criteria.check_out) == (date(2027, 3, 14), date(2027, 3, 16))
    assert criteria.max_price == 500 and criteria.types == ["cabin"]
    assert criteria.activities == ["drumeții"]


def test_an_english_request() -> None:
    criteria = rules("Looking for an apartment in Bucharest for 2 people, December 4-6, under 100 euro", "en")
    assert criteria.destination == "București" and criteria.guests == 2
    assert (criteria.check_in, criteria.check_out) == (date(2026, 12, 4), date(2026, 12, 6))
    assert criteria.max_price == 500 and criteria.types == ["apartment"]


def test_longest_city_name_wins() -> None:
    assert rules("vreau ceva în Poiana Brașov").destination == "Poiana Brașov"
    assert rules("ceva in Cluj-Napoca").destination == "Cluj-Napoca"
    assert rules("ceva in Cluj").destination == "Cluj-Napoca"


def test_a_city_is_not_found_inside_another_word() -> None:
    assert rules("vreau branza").destination is None


def test_dates_across_months_and_price_range() -> None:
    criteria = rules("Sibiu, 30 decembrie - 2 ianuarie, intre 200 si 400 lei")
    assert (criteria.check_in, criteria.check_out) == (date(2026, 12, 30), date(2027, 1, 2))
    assert (criteria.min_price, criteria.max_price) == (200, 400)


def test_impossible_date_is_ignored() -> None:
    assert rules("Sibiu 30-31 februarie").check_in is None


def test_language_detection() -> None:
    assert detect_language("caut o cabana pentru 4 persoane", "en") == "ro"
    assert detect_language("looking for a cabin for 4 people", "ro") == "en"
    assert detect_language("Sibiu", "en") == "en"
