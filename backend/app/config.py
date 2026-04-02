from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    APP_ENV: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int

    model_config = SettingsConfigDict(
        env_file=".env",            
        env_file_encoding="utf-8" 
    )
    # Email Settings (Gmail SMTP)
    SMTP_EMAIL: str
    SMTP_APP_PASSWORD: str
    FRONTEND_URL: str

    # Bootstrap Admin Settings
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    ADMIN_FULLNAME: str



settings = Settings()
