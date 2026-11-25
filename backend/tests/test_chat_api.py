"""POST /chat/parse with a fake language model (no network, no database)."""

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.api.chat import get_known_cities, get_llm_client
from app.main import app
from app.services.chat.gemini import LLMError

client = TestClient(app)
IN = (date.today() + timedelta(days=30)).isoformat()
OUT = (date.today() + timedelta(days=32)).isoformat()


class FakeLLM:
    def __init__(self, answer=None, fail=False):
        self.answer, self.fail, self.previous = answer, fail, None

    def extract(self, message, today, previous):
        self.previous = previous
        if self.fail:
            raise LLMError("down")
        return self.answer


@pytest.fixture
def use_llm():
    app.dependency_overrides[get_known_cities] = lambda: ["Brașov", "Sibiu"]

    def _use(llm):
        app.dependency_overrides[get_llm_client] = lambda: llm
        return llm

    _use(None)
    yield _use
    app.dependency_overrides.clear()


def post(message: str, **extra):
    return client.post("/chat/parse", json={"message": message, **extra})


def test_llm_answer_becomes_criteria(use_llm) -> None:
    use_llm(FakeLLM({"destination": "Brașov", "check_in": IN, "check_out": OUT,
                     "guests": 4, "types": ["cabin"], "language": "ro"}))
    body = post("cabana la Brasov").json()
    assert body["source"] == "llm" and body["missing"] == [] and body["clarification"] is None
    assert body["criteria"]["destination"] == "Brașov" and body["criteria"]["check_in"] == IN
    assert body["warnings"] == []


@pytest.mark.parametrize(("language", "word"), [("ro", "Unde"), ("en", "Where")])
def test_missing_destination_asks_in_the_users_language(use_llm, language, word) -> None:
    use_llm(FakeLLM({"guests": 2, "language": language}))
    body = post("2 people").json()
    assert body["missing"] == ["destination"] and body["clarification"].startswith(word)
    assert body["criteria"]["guests"] == 2


def test_follow_up_answer_completes_the_previous_filters(use_llm) -> None:
    llm = use_llm(FakeLLM({"destination": "Sibiu", "language": "ro"}))
    body = post("Sibiu", previous={"guests": 2, "types": ["apartment"]}).json()
    assert llm.previous.guests == 2
    assert body["criteria"]["destination"] == "Sibiu" and body["criteria"]["guests"] == 2
    assert body["criteria"]["types"] == ["apartment"] and body["missing"] == []


def test_llm_failure_falls_back_to_the_rules(use_llm) -> None:
    use_llm(FakeLLM(fail=True))
    response = post("cabană la Brașov pentru 3 persoane")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "fallback" and "llm_unavailable" in body["warnings"]
    assert body["criteria"]["destination"] == "Brașov" and body["criteria"]["guests"] == 3


def test_without_a_key_the_rules_are_used(use_llm) -> None:
    body = post("hotel in Sibiu").json()
    assert body["source"] == "fallback" and body["warnings"] == []
    assert body["criteria"]["types"] == ["hotel"]


def test_nonsense_from_the_model_never_reaches_the_filters(use_llm) -> None:
    use_llm(FakeLLM({"destination": ["x"], "guests": "many", "check_in": "2001-01-01",
                     "check_out": "2001-01-05", "language": "fr", "sql": "DROP TABLE"}))
    body = post("test", locale="en").json()
    assert body["criteria"] == {
        "destination": None, "check_in": None, "check_out": None, "guests": None,
        "min_price": None, "max_price": None, "types": [], "activities": [],
    }
    assert body["warnings"] == ["dates_ignored"] and body["language"] == "en"


@pytest.mark.parametrize(
    "payload",
    [
        {"message": ""},
        {"message": "    "},
        {"message": "x" * 501},
        {"message": "ok", "locale": "de"},
        {"message": "ok", "previous": {"guests": 99}},
        {"message": "ok", "previous": {"types": ["castle"]}},
        {},
    ],
)
def test_invalid_requests_are_422(use_llm, payload) -> None:
    assert client.post("/chat/parse", json=payload).status_code == 422
