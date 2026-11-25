"""The Gemini client against a fake HTTP server (no network, no real key)."""

import json
from datetime import date

import httpx
import pytest

from app.schemas.chat import SearchCriteria
from app.services.chat.gemini import GeminiClient, LLMError

TODAY = date(2026, 11, 25)


def client_for(handler) -> GeminiClient:
    return GeminiClient(
        "secret-key", "test-model", transport=httpx.MockTransport(handler), retry_delay=0
    )


def ok(arguments) -> httpx.Response:
    return httpx.Response(200, json={"steps": [
        {"type": "thought"},
        {"type": "function_call", "id": "1", "name": "set_search_filters", "arguments": arguments},
    ]})


def test_sends_a_forced_function_call_and_reads_the_arguments() -> None:
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"], seen["headers"] = str(request.url), request.headers
        seen["body"] = json.loads(request.content)
        return ok({"destination": "Brașov", "language": "ro"})

    result = client_for(handler).extract("cabană la Brașov", TODAY, SearchCriteria(guests=2))

    assert result == {"destination": "Brașov", "language": "ro"}
    assert seen["url"].endswith("/v1beta/interactions") and "secret-key" not in seen["url"]
    assert seen["headers"]["x-goog-api-key"] == "secret-key"
    body = seen["body"]
    assert body["model"] == "test-model" and body["store"] is False
    assert body["generation_config"]["tool_choice"]["allowed_tools"]["mode"] == "any"
    assert "2026-11-25" in body["system_instruction"]
    assert '"guests": 2' in body["input"] and "cabană la Brașov" in body["input"]


def test_arguments_given_as_text_are_parsed() -> None:
    result = client_for(lambda r: ok('{"guests": 3}')).extract("x", TODAY, None)
    assert result == {"guests": 3}


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(429, json={"error": "quota"}),
        httpx.Response(400, json={"error": "bad key"}),
        httpx.Response(500, text="boom"),
        httpx.Response(200, text="not json"),
        httpx.Response(200, json={"steps": [{"type": "model_output"}]}),
        httpx.Response(200, json={"unexpected": True}),
        httpx.Response(200, json={"steps": ["junk"]}),
    ],
)
def test_every_failure_becomes_llm_error(response) -> None:
    with pytest.raises(LLMError):
        client_for(lambda r: response).extract("x", TODAY, None)


def test_timeout_becomes_llm_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("slow", request=request)

    with pytest.raises(LLMError):
        client_for(handler).extract("x", TODAY, None)


@pytest.mark.parametrize(("first_status", "calls"), [(503, 2), (500, 2), (429, 1), (401, 1)])
def test_only_temporary_server_errors_are_retried_once(first_status, calls) -> None:
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(1)
        return httpx.Response(first_status) if len(seen) == 1 else ok({"guests": 2})

    client = client_for(handler)
    if calls == 2:
        assert client.extract("x", TODAY, None) == {"guests": 2}
    else:
        with pytest.raises(LLMError):
            client.extract("x", TODAY, None)
    assert len(seen) == calls
