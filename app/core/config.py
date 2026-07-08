from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production"

    DATABASE_URL: str
    SYNC_DATABASE_URL: str

    REDIS_URL: str

    RABBITMQ_URL: str


settings = Settings()
