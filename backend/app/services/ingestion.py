"""
Document ingestion pipeline.
Handles file parsing, text chunking, embedding, and storage.
"""
import hashlib
import json
import logging
from typing import Optional
from uuid import UUID

from docx import Document as DocxDocument

from app.config import get_settings
from app.db.client import db
from app.db import queries
from app.services.embeddings import embedding_service

logger = logging.getLogger(__name__)


class IngestionService:
    """Handles the full document ingestion pipeline."""

    def __init__(self):
        self.settings = get_settings()

    # ─── File Parsing ─────────────────────────────────────────────────────

    def parse_file(self, content: bytes, filename: str, mime_type: str) -> str:
        """Extract text from a file based on its type."""
        lower = filename.lower()

        if lower.endswith(".pdf"):
            return self._parse_pdf(content)
        elif lower.endswith(".docx"):
            return self._parse_docx(content)
        elif lower.endswith((".txt", ".md", ".markdown", ".csv", ".json", ".log")):
            return content.decode("utf-8", errors="replace")
        else:
            # Try to decode as text
            try:
                return content.decode("utf-8")
            except UnicodeDecodeError:
                raise ValueError(f"Unsupported file format: {filename}")

    def _parse_pdf(self, content: bytes) -> str:
        """Extract text from a PDF file using PyMuPDF or pypdf."""
        import io
        try:
            import fitz
            doc = fitz.open(stream=content, filetype="pdf")
            text_parts = []
            for page_num, page in enumerate(doc, 1):
                page_text = page.get_text("text")
                if page_text.strip():
                    text_parts.append(f"[Page {page_num}]\n{page_text}")
            doc.close()
            return "\n\n".join(text_parts)
        except ImportError:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            text_parts = []
            for page_num, page in enumerate(reader.pages, 1):
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text_parts.append(f"[Page {page_num}]\n{page_text}")
            return "\n\n".join(text_parts)

    def _parse_docx(self, content: bytes) -> str:
        """Extract text from a DOCX file."""
        import io
        doc = DocxDocument(io.BytesIO(content))
        return "\n\n".join(
            paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()
        )

    # ─── Text Chunking ───────────────────────────────────────────────────

    def chunk_text(self, text: str) -> list[dict]:
        """
        Split text into overlapping chunks.
        Uses a separator hierarchy to respect document structure.
        Returns list of {content, chunk_index, metadata}.
        """
        chunk_size = self.settings.chunk_size
        chunk_overlap = self.settings.chunk_overlap

        if not text.strip():
            return []

        # Split by separator hierarchy
        chunks = []
        separators = ["\n\n", "\n", ". ", " "]

        segments = self._recursive_split(text, separators, chunk_size)

        # Merge small segments and apply overlap
        current_chunk = ""
        chunk_index = 0

        for segment in segments:
            if len(current_chunk) + len(segment) <= chunk_size:
                current_chunk += segment
            else:
                if current_chunk.strip():
                    chunks.append({
                        "content": current_chunk.strip(),
                        "chunk_index": chunk_index,
                        "metadata": {},
                    })
                    chunk_index += 1

                # Start new chunk with overlap from previous
                if chunk_overlap > 0 and current_chunk:
                    overlap_text = current_chunk[-chunk_overlap:]
                    current_chunk = overlap_text + segment
                else:
                    current_chunk = segment

        # Don't forget the last chunk
        if current_chunk.strip():
            chunks.append({
                "content": current_chunk.strip(),
                "chunk_index": chunk_index,
                "metadata": {},
            })

        # Extract page numbers from content if present
        for chunk in chunks:
            content = chunk["content"]
            if "[Page " in content:
                import re
                pages = re.findall(r"\[Page (\d+)\]", content)
                if pages:
                    chunk["metadata"]["pages"] = [int(p) for p in pages]

        return chunks

    def _recursive_split(
        self, text: str, separators: list[str], chunk_size: int
    ) -> list[str]:
        """Recursively split text using a hierarchy of separators."""
        if len(text) <= chunk_size:
            return [text]

        # Try each separator
        for sep in separators:
            parts = text.split(sep)
            if len(parts) > 1:
                result = []
                for part in parts:
                    if part:
                        result.append(part + (sep if sep != " " else " "))
                return result

        # Fallback: hard split
        result = []
        for i in range(0, len(text), chunk_size):
            result.append(text[i : i + chunk_size])
        return result

    # ─── Hash Computation ─────────────────────────────────────────────────

    @staticmethod
    def compute_hash(content: bytes) -> str:
        """Compute SHA-256 hash of file content for idempotency."""
        return hashlib.sha256(content).hexdigest()

    # ─── Full Ingestion Pipeline ──────────────────────────────────────────

    async def ingest_document(
        self,
        workspace_id: UUID,
        user_id: UUID,
        filename: str,
        content: bytes,
        mime_type: str,
    ) -> dict:
        """
        Full ingestion pipeline:
        1. Compute hash → check for duplicates
        2. Parse file → extract text
        3. Chunk text → create overlapping segments
        4. Embed chunks → call Gemini API
        5. Store document + chunks in DB
        """
        file_hash = self.compute_hash(content)

        # 1. Check for duplicate (idempotency)
        existing = await db.fetchrow(
            queries.CHECK_DOCUMENT_HASH, str(workspace_id), file_hash
        )
        if existing:
            return {
                "already_exists": True,
                "message": f"Document '{filename}' already exists in this workspace.",
                "document_id": str(existing["id"]),
            }

        # 2. Parse file
        try:
            text = self.parse_file(content, filename, mime_type)
        except ValueError as e:
            raise ValueError(f"Failed to parse '{filename}': {str(e)}")

        if not text.strip():
            raise ValueError(f"No text content found in '{filename}'.")

        # 3. Insert document record (status: processing)
        doc_row = await db.fetchrow(
            queries.INSERT_DOCUMENT,
            str(workspace_id),
            filename,
            file_hash,
            len(content),
            mime_type,
            str(user_id),
        )

        if not doc_row:
            return {
                "already_exists": True,
                "message": f"Document '{filename}' already exists in this workspace.",
            }

        document_id = doc_row["id"]

        try:
            # 4. Chunk text
            chunks = self.chunk_text(text)
            logger.info(f"Created {len(chunks)} chunks for '{filename}'")

            if not chunks:
                await db.execute(queries.UPDATE_DOCUMENT_STATUS, document_id, "error")
                raise ValueError(f"No chunks generated from '{filename}'.")

            # 5. Embed chunks in batches
            chunk_texts = [c["content"] for c in chunks]
            embeddings = await embedding_service.embed_batch(chunk_texts)

            # 6. Store chunks
            for chunk, embedding in zip(chunks, embeddings):
                embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
                await db.execute(
                    queries.INSERT_CHUNK,
                    str(document_id),
                    str(workspace_id),
                    chunk["chunk_index"],
                    chunk["content"],
                    len(chunk["content"].split()),  # Rough token count
                    embedding_str,
                    json.dumps(chunk["metadata"]),
                )

            # 7. Mark document as ready
            await db.execute(queries.UPDATE_DOCUMENT_STATUS, document_id, "ready")

            return {
                "already_exists": False,
                "message": f"Successfully ingested '{filename}' ({len(chunks)} chunks).",
                "document_id": str(document_id),
                "chunk_count": len(chunks),
            }

        except Exception as e:
            # Mark as error if ingestion fails
            await db.execute(queries.UPDATE_DOCUMENT_STATUS, document_id, "error")
            logger.error(f"Ingestion failed for '{filename}': {e}")
            raise


# Global instance
ingestion_service = IngestionService()
