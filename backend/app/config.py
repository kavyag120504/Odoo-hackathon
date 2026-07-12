from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./assetflow.db"
    SECRET_KEY: str = "dev-secret-change-me-in-prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720
    FRONTEND_ORIGIN: str = "http://localhost:5173"


settings = Settings()
