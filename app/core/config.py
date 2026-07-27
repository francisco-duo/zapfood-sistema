from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production"

    # RNF002: pepper aplicado antes do hashing Argon2id, mantido apenas em
    # variável de ambiente (nunca no banco) como camada extra de defesa.
    PEPPER_SENHA: str = "change-me-in-production-pepper"

    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 12

    # E-mails transacionais (verificação de cadastro e redefinição de senha).
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "zapFood <onboarding@resend.dev>"
    FRONTEND_URL_FALLBACK: str = "http://localhost:5174"
    EMAIL_VERIFICATION_EXPIRE_MINUTES: int = 60 * 24
    PASSWORD_RESET_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str
    SYNC_DATABASE_URL: str

    REDIS_URL: str

    RABBITMQ_URL: str


settings = Settings()
