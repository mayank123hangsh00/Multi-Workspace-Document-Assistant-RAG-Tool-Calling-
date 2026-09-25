"""
Retrieval service for workspace-scoped vector search.
Embeds the query and performs cosine similarity search filtered by workspace_id.
"""
import logging
from uuid import UUID

from app.config import get_settings
from app.db.client import db
from app.db import queries
from app.services.embeddings import embedding_service
from app.models.chat import RetrievedChunk

logger = logging.getLogger(__name__)


class RetrievalService:
    """Performs workspace-scoped vector retrieval."""

    def __init__(self):
        self.settings = get_settings()

    async def retrieve(
        self,
        query: str,
        workspace_id: UUID,
        top_k: int = None,
        similarity_threshold: float = None,
    ) -> list[RetrievedChunk]:
        """
        Retrieve the most relevant chunks from the active workspace.

        CRITICAL: workspace_id filtering happens INSIDE the SQL query,
        not as a post-filter. This is the tenancy boundary.
        """
        if top_k is None:
            top_k = self.settings.max_retrieved_chunks
        if similarity_threshold is None:
            similarity_threshold = self.settings.similarity_threshold

        # 1. Embed the query
        query_embedding = await embedding_service.embed_query(query)
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        # 2. Vector search scoped to workspace
        rows = await db.fetch(
            queries.VECTOR_SEARCH,
            embedding_str,
            str(workspace_id),
            top_k,
        )

        # 3. Filter by similarity threshold
        chunks = []
        import json
        for row in rows:
            similarity = float(row["similarity"])
            if similarity >= similarity_threshold:
                meta = row["metadata"]
                if isinstance(meta, str):
                    meta = json.loads(meta) if meta else {}
                elif meta is None:
                    meta = {}

                chunks.append(
                    RetrievedChunk(
                        chunk_id=row["id"],
                        document_id=row["document_id"],
                        filename=row["filename"],
                        content=row["content"],
                        similarity=round(similarity, 4),
                        chunk_index=row["chunk_index"],
                        metadata=meta,
                    )
                )

        logger.info(
            f"Retrieved {len(chunks)} chunks for workspace {workspace_id} "
            f"(query: '{query[:50]}...', threshold: {similarity_threshold})"
        )

        return chunks

    def format_chunks_for_prompt(self, chunks: list[RetrievedChunk]) -> str:
        """Format retrieved chunks into a prompt-friendly string."""
        if not chunks:
            return "<documents>\nNo relevant documents found.\n</documents>"

        parts = ["<documents>"]
        for i, chunk in enumerate(chunks, 1):
            parts.append(
                f"\n[Source {i}: {chunk.filename}, Chunk #{chunk.chunk_index + 1}]"
                f"\n{chunk.content}\n"
            )
        parts.append("</documents>")

        return "\n".join(parts)


# Global instance
retrieval_service = RetrievalService()
