"""Regression tests for public API contracts and the shipped frontend."""
from fastapi.testclient import TestClient

from app.content import QUIZ
from app.main import app

client = TestClient(app)


def test_frontend_and_assets_are_served():
    for path, expected in (
        ("/", "text/html"),
        ("/styles.css", "text/css"),
        ("/app.js", "javascript"),
    ):
        response = client.get(path)
        assert response.status_code == 200
        assert expected in response.headers["content-type"]


def test_quiz_get_does_not_disclose_answers_or_explanations():
    response = client.get("/api/quiz")
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) == len(QUIZ)
    assert all("answer" not in q and "explanation" not in q for q in questions)


def test_quiz_scoring_returns_explanations_after_submission():
    answers = {q["id"]: q["answer"] for q in QUIZ}
    response = client.post("/api/quiz", json={"answers": answers})
    assert response.status_code == 200
    body = response.json()
    assert body["score"] == body["total"] == len(QUIZ)
    assert body["percentage"] == 100
    assert all(item["correct"] and item["explanation"] for item in body["results"])


def test_invalid_ratio_inputs_are_rejected():
    payload = {
        "revenue": 0,
        "cost_of_sales": 100,
        "operating_expenses": 50,
        "current_assets": 300,
        "current_liabilities": 0,
        "capital_employed": 1000,
    }
    response = client.post("/api/ratios", json=payload)
    assert response.status_code == 422


def test_break_even_with_no_positive_contribution():
    response = client.post(
        "/api/break-even",
        json={"fixed_costs": 100, "unit_price": 30, "unit_variable_cost": 30},
    )
    assert response.status_code == 200
    assert response.json()["break_even_units"] is None


def test_negative_break_even_inputs_are_rejected():
    response = client.post(
        "/api/break-even",
        json={"fixed_costs": -100, "unit_price": 50, "unit_variable_cost": 30},
    )
    assert response.status_code == 422


def test_project_branding_is_consistent():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["service"] == "Ledger-Lens"
    assert app.title == "Ledger-Lens"
    page = client.get("/")
    assert "<title>Ledger-Lens" in page.text
    assert page.text.count("Ledger-Lens") >= 2
