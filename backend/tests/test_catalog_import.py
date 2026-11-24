"""Tests of the catalog cleaning rules (no database needed)."""

import json
from pathlib import Path

from app.services.catalog_import import clean_catalog

SEED_FILE = Path(__file__).resolve().parents[2] / "data" / "catalog_seed.json"
AMENITIES = {"wifi", "parking", "pool"}


def make_record(**overrides) -> dict:
    record = {
        "source_id": "t-1", "title": "Nice cabin", "type": "cabin", "city": "Brașov",
        "latitude": 45.64, "longitude": 25.58, "price_per_night": 300, "capacity": 4,
        "amenities": ["wifi"], "images": [],
    }
    record.update(overrides)
    return record


def test_valid_record_is_kept() -> None:
    report = clean_catalog([make_record()], AMENITIES)
    assert len(report.clean) == 1 and not report.dropped


def test_incomplete_records_are_dropped() -> None:
    no_city = make_record(source_id="a", city=None)
    no_price = make_record(source_id="b")
    del no_price["price_per_night"]
    report = clean_catalog([no_city, no_price], AMENITIES)
    assert not report.clean
    assert {d.source_id for d in report.dropped} == {"a", "b"}


def test_type_is_normalized() -> None:
    report = clean_catalog([make_record(type="Entire rental unit")], AMENITIES)
    assert report.clean[0].type == "apartment"


def test_unknown_type_is_dropped() -> None:
    report = clean_catalog([make_record(type="spaceship")], AMENITIES)
    assert report.dropped and "type" in report.dropped[0].reason


def test_coordinates_outside_romania_are_dropped() -> None:
    report = clean_catalog([make_record(latitude=10.0)], AMENITIES)
    assert report.dropped and "latitude" in report.dropped[0].reason


def test_capacity_and_price_limits() -> None:
    report = clean_catalog(
        [make_record(source_id="a", capacity=0), make_record(source_id="b", price_per_night=0),
         make_record(source_id="c", capacity=500)],
        AMENITIES,
    )
    assert len(report.dropped) == 3


def test_amenities_are_normalized() -> None:
    report = clean_catalog([make_record(amenities=[" WiFi ", "wifi", "jetpack", "pool"])], AMENITIES)
    assert report.clean[0].amenities == ["wifi", "pool"]


def test_duplicate_source_id_is_dropped() -> None:
    report = clean_catalog([make_record(), make_record(title="Other title")], AMENITIES)
    assert len(report.clean) == 1
    assert report.dropped[0].reason == "duplicate source_id"


def test_committed_seed_file_is_fully_valid() -> None:
    catalog = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    report = clean_catalog(catalog["accommodations"], {a["slug"] for a in catalog["amenities"]})
    assert not report.dropped
    assert len(report.clean) >= 30
