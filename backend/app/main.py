from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import admin, auth, campaigns, checklist, indicators, questionnaires, respond, results

API_PREFIX = "/api/v1"

app = FastAPI(
    title="Integrity Management Dashboard API",
    version="0.1.0",
    description="Опитувальники, конструктор анкет, ролі та хвилі оцінювання.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (auth, admin, questionnaires, campaigns, respond, checklist, indicators, results):
    app.include_router(module.router, prefix=API_PREFIX)


@app.get("/health", tags=["service"])
def health():
    return {"status": "ok"}
