"""
Application configuration using Pydantic Settings.
All configuration values are loaded from environment variables (.env file).
This ensures production secrets are never hardcoded.
"""

from typing import Literal
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # ========================================================================
    # Database Configuration
    # ========================================================================
    database_url: str = "postgresql+asyncpg://realestate:password@localhost:5432/realestate_db"

    # ========================================================================
    # Redis Configuration
    # ========================================================================
    redis_url: str = "redis://localhost:6379"
    redis_db: int = 0
    redis_ttl_seconds: int = 300

    # ========================================================================
    # LLM Provider Configuration (CRITICAL - Switches all LLM behavior)
    # ========================================================================
    llm_provider: Literal["ollama", "groq", "openai", "gemini"] = "ollama"
    llm_temperature: float = 0.7
    llm_max_tokens: int = 1000
    llm_timeout_seconds: int = 60
    llm_max_retries: int = 3

    # ========================================================================
    # Ollama Configuration (Default - Local LLM, Free)
    # ========================================================================
    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "llama3.2"

    # ========================================================================
    # Groq API Configuration (Optional - Cloud LLM, Free Tier)
    # ========================================================================
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # ========================================================================
    # OpenAI Configuration (Optional - Cloud LLM, Paid)
    # ========================================================================
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str = "https://api.openai.com/v1"

    # ========================================================================
    # Google Gemini Configuration (Optional - Cloud LLM, Free Tier)
    # ========================================================================
    google_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # ========================================================================
    # Data Storage Strategy (Configurable - switches without code changes)
    # ========================================================================
    # Options:
    #   "hybrid"    - Our DB + Leadrat API (default, safest)
    #   "api_only"  - Leadrat API only, no local DB storage
    #   "db_direct" - Direct Leadrat DB connection (future)
    data_storage_mode: Literal["hybrid", "api_only", "db_direct"] = "hybrid"
    leadrat_db_url: str = ""
    leadrat_db_schema: str = "public"

    # ========================================================================
    # Leadrat CRM Integration
    # ========================================================================
    leadrat_base_url: str = "https://connect.leadrat.com/api/v1"
    leadrat_auth_url: str = "https://connect.leadrat.com/api/v1/authentication/token"
    leadrat_tenant: str = ""
    leadrat_api_key: str = ""
    leadrat_secret_key: str = ""
    leadrat_token_cache_ttl: int = 3600
    leadrat_request_timeout: int = 30

    # ========================================================================
    # Engageto WhatsApp Business API
    # ========================================================================
    engageto_token: str = ""
    engageto_phone_id: str = ""
    engageto_webhook_secret: str = ""
    engageto_api_base_url: str = "https://api.engageto.com/v1"
    engageto_request_timeout: int = 30

    # ========================================================================
    # Spring Boot Backend Integration
    # ========================================================================
    spring_boot_url: str = "http://localhost:8080"
    spring_boot_timeout_seconds: int = 30

    # ========================================================================
    # JWT & Security
    # ========================================================================
    jwt_secret_key: str = "your_jwt_secret_minimum_32_chars_long_minimum_32_chars_long"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    # ========================================================================
    # Chroma Vector Database (RAG - Retrieval Augmented Generation)
    # ========================================================================
    chroma_db_path: str = "./chroma_db"
    chroma_persist_directory: str = "./chroma_db"

    # ========================================================================
    # Application Configuration
    # ========================================================================
    log_level: str = "INFO"
    environment: str = "development"
    debug: bool = False
    demo_mode: bool = True
    force_demo_safe_mode: bool = False

    # ========================================================================
    # CORS Configuration
    # ========================================================================
    allowed_origins: str = (
        "http://localhost:3000,"
        "http://localhost:8080,"
        "http://127.0.0.1:3000,"
        "https://chatbot-leadrat.vercel.app,"
        "https://real-estate-crm.vercel.app,"
        "https://chatbot.leadrat.com"
    )

    # ========================================================================
    # Rate Limiting
    # ========================================================================
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000

    # ========================================================================
    # WhatsApp Session Configuration
    # ========================================================================
    session_timeout_hours: int = 24
    conversation_history_limit: int = 20
    session_cache_ttl: int = 86400  # 24 hours in seconds

    # ========================================================================
    # Property Caching
    # ========================================================================
    property_cache_ttl: int = 300  # 5 minutes in seconds

    # ========================================================================
    # Monitoring & Observability
    # ========================================================================
    sentry_dsn: str = ""
    sentry_environment: str = "development"
    sentry_traces_sample_rate: float = 0.1

    class Config:
        """Pydantic settings configuration."""

        # Explicitly set .env file path relative to this file's directory
        env_file = str(Path(__file__).parent.parent / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global singleton settings instance
# Access via: from app.config import settings
settings = Settings()
