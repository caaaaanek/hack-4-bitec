from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Налаштування читаються зі змінних оточення або з файлу .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://imd:imd@localhost:5432/imd"

    # Секрет для підпису JWT. У .env.example порожній, задається локально.
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    # Вартість хешування паролів. 12 для роботи, у тестах менше заради швидкості.
    bcrypt_rounds: int = 12

    # Мінімальний розмір групи для показу агрегатів (k-анонімність).
    default_min_group_size: int = 5

    # Через кому: адреси фронтенду, яким дозволено звертатися до API.
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Ключ, з яким інші системи передають факти в POST /indicators (заголовок X-Integration-Key).
    integration_api_key: str = ""

    # Пароль для синтетичних демо-користувачів, яких створює seed.
    demo_password: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
