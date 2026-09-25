"""
Application configuration loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Abstrat Document Assistant"
    debug: bool = False
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    secret_key: str = "change-me-in-production"

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str

    # Groq (LLM)
    groq_api_key: str
    groq_model: str = "openai/gpt-oss-120b"

    # Google Gemini (Embeddings)
    google_api_key: str
    embedding_model: str = "models/gemini-embedding-001"
    embedding_dimensions: int = 768

    # Discord Webhook
    discord_webhook_url: str = ""

    # Ingestion
    chunk_size: int = 2000  # characters (~500 tokens)
    chunk_overlap: int = 200  # characters (~50 tokens)
    max_file_size_mb: int = 10
    max_retrieved_chunks: int = 5
    similarity_threshold: float = 0.3

    # Tool calling
    max_tool_iterations: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
