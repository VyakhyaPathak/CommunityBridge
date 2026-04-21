import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./communitybridge.db"
    
    # AI & Maps
    GEMINI_API_KEY: str = ""
    OPENCAGE_API_KEY: str = ""
    
    # App
    ENVIRONMENT: str = "development"
    PORT: int = 3000
    CORS_ORIGINS: str = "*"
    FRONTEND_URL: str = "http://localhost:3000"
    SECRET_KEY: str = "your_secret_key_here_minimum_32_characters_long"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    return Settings()
