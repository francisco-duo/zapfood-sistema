from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    LOG_LEVEL: str = "INFO"

    # Lista separada por vírgula; em produção deve apontar para os domínios reais.
    CORS_ORIGINS: str = "http://localhost:5174,http://localhost:5175,http://localhost:5176"

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

    # Pool de conexões do SQLAlchemy/asyncpg. Defaults pensados para uma API
    # rodando com poucos workers (2-4); ajuste para cima se escalar workers/réplicas.
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT_SEGUNDOS: int = 30
    # Recicla conexões antes que o Postgres ou um load balancer intermediário
    # as derrube por ociosidade — evita erros esporádicos de "conexão fechada".
    DB_POOL_RECYCLE_SEGUNDOS: int = 1800
    DB_ECHO: bool = False

    REDIS_URL: str
    REDIS_MAX_CONNECTIONS: int = 20
    REDIS_SOCKET_TIMEOUT_SEGUNDOS: int = 5
    REDIS_SOCKET_CONNECT_TIMEOUT_SEGUNDOS: int = 5

    RABBITMQ_URL: str
    # Intervalo de heartbeat AMQP: sem isso o cliente pode demorar demais pra
    # perceber que a conexão caiu (ex.: broker reiniciado, rede instável).
    RABBITMQ_HEARTBEAT_SEGUNDOS: int = 60
    # Quantas mensagens não confirmadas o worker aceita por vez; baixo demais
    # sub-utiliza I/O, alto demais deixa mensagens "presas" num worker lento.
    WORKER_PREFETCH_COUNT: int = 10

    @property
    def cors_origins_list(self) -> list[str]:
        return [origem.strip() for origem in self.CORS_ORIGINS.split(",") if origem.strip()]


settings = Settings()
