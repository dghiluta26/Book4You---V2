"""Collects all routers in one place. New endpoints are registered here."""

from fastapi import APIRouter

from app.api import accommodations, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(accommodations.router)
