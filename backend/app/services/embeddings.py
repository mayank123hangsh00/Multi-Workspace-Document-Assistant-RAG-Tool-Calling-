"""
Embedding service using Google Gemini text-embedding-004.
Handles single and batch embedding generation.
"""
import google.generativeai as genai
from typing import Union
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Generates embeddings using Google Gemini's text-embedding-004 model."""

    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.google_api_key)
        self.model = settings.embedding_model
        self.dimensions = settings.embedding_dimensions

    async def embed_text(self, text: str) -> list[float]:
        """Embed a single text string."""
        try:
            result = genai.embed_content(
                model=self.model,
                content=text,
                task_type="retrieval_document",
                output_dimensionality=self.dimensions,
            )
            return result["embedding"]
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            raise

    async def embed_query(self, query: str) -> list[float]:
        """Embed a query string (uses retrieval_query task type for better search)."""
        try:
            result = genai.embed_content(
                model=self.model,
                content=query,
                task_type="retrieval_query",
                output_dimensionality=self.dimensions,
            )
            return result["embedding"]
        except Exception as e:
            logger.error(f"Query embedding error: {e}")
            raise

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed multiple texts in a batch."""
        try:
            # Gemini supports batch embedding
            result = genai.embed_content(
                model=self.model,
                content=texts,
                task_type="retrieval_document",
                output_dimensionality=self.dimensions,
            )
            return result["embedding"]
        except Exception as e:
            logger.error(f"Batch embedding error: {e}")
            raise


# Global instance
embedding_service = EmbeddingService()
