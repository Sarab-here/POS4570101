from fastapi import FastAPI

from app.main import app


def test_application_boots_without_product_routes() -> None:
    assert isinstance(app, FastAPI)
    assert app.routes == []
