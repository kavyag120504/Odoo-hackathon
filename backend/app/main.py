from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, booking, employees

# Import models so metadata is populated before create_all.
import app.models  # noqa: F401

app = FastAPI(title="AssetFlow API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Hackathon convenience: create tables on boot. Person A can swap this for
    # migrations/seed later without touching auth.
    Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "assetflow"}


app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(booking.router)
