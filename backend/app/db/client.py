"""
Database client using asyncpg for direct Postgres access with pgvector.
"""
import asyncpg
import json
from typing import Optional
from app.config import get_settings


class Database:
    """Async Postgres connection pool manager."""

    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Initialize the connection pool."""
        settings = get_settings()
        self.pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=1,
            max_size=10,
            command_timeout=60,
            statement_cache_size=0,
            max_cached_statement_lifetime=0,
        )
        # Register vector type codec
        async with self.pool.acquire() as conn:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            # Register custom type codec for vector
            await self._register_vector_codec(conn)

    async def _register_vector_codec(self, conn):
        """Register pgvector type for asyncpg."""
        # pgvector stores vectors as text like '[1,2,3]'
        # We handle encoding/decoding manually in queries
        pass

    async def disconnect(self):
        """Close the connection pool."""
        if self.pool:
            await self.pool.close()

    async def fetch(self, query: str, *args):
        """Execute a query and return all rows."""
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def fetchrow(self, query: str, *args):
        """Execute a query and return a single row."""
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def fetchval(self, query: str, *args):
        """Execute a query and return a single value."""
        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, *args)

    async def execute(self, query: str, *args):
        """Execute a query without returning results."""
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)

    async def executemany(self, query: str, args_list):
        """Execute a query for multiple sets of arguments."""
        async with self.pool.acquire() as conn:
            return await conn.executemany(query, args_list)


# Global database instance
db = Database()
